import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import { welcomeSubscriberEmail } from '@/lib/email-templates/welcome-subscriber';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { allow, prune } from '@/lib/send-limits';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Counted in the server-only send log (src/lib/send-limits.ts), because the
// limiter below only knows about the one server instance it runs in, and
// because the subscribers table itself accepts rows from the public API with
// any date on them, so it cannot be what a limit is counted from. Past this
// many welcome emails in an hour the address is still saved, but no welcome
// goes out: a real surge can be welcomed later, and a script gets nothing to
// send.
const WELCOME_EMAILS_PER_HOUR = 20;

export async function POST(request: Request) {
  // This endpoint emails whatever address it is given, which makes it a tool
  // for mailing strangers from our domain if a script hammers it. That costs
  // sender reputation, and the lead and claim emails ride on the same
  // reputation. Three sign-ups in ten minutes from one address is plenty for
  // a person. Answers "success" so a script learns nothing from being limited.
  if (isRateLimited('subscribe', getClientIp(request), { windowMs: 10 * 60_000, maxRequests: 3 })) {
    return NextResponse.json({ success: true });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { email, source, website } = body; // website is a honeypot

  // Honeypot: bots fill hidden fields. Pretend success without inserting.
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // Housekeeping for the send log (see src/lib/send-limits.ts).
  await prune(supabase).catch(() => {});
  const { error: insertErr } = await supabase.from('subscribers').insert({
    email,
    source: source || null,
  });

  // Unique constraint violation (already subscribed) — treat as success,
  // never leak "already exists" to the client.
  if (insertErr && insertErr.code !== '23505') {
    console.error('[subscribe] insert failed', { code: insertErr.code, message: insertErr.message });
    return NextResponse.json({ error: 'We could not sign you up just now. Please try again.' }, { status: 500 });
  }

  // Welcome email — only for genuinely new subscribers (skip duplicate signups
  // so re-submitting the form can't be used to spam someone's inbox).
  if (!insertErr && (await allow(supabase, 'subscriber_welcome', null, WELCOME_EMAILS_PER_HOUR, 60 * 60 * 1000))) {
    await sendEmail({ to: email, ...welcomeSubscriberEmail({ email: escapeHtml(email) }) });
  }

  return NextResponse.json({ success: true });
}
