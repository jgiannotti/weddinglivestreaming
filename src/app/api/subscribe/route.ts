import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { email, source, website } = body; // website is a honeypot

  // Honeypot: bots fill hidden fields. Pretend success without inserting.
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error: insertErr } = await supabase.from('subscribers').insert({
    email,
    source: source || null,
  });

  // Unique constraint violation (already subscribed) — treat as success,
  // never leak "already exists" to the client.
  if (insertErr && insertErr.code !== '23505') {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
