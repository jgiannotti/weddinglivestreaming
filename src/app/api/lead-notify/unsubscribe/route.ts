import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyUnsubscribe, UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL } from '@/lib/unsubscribe-link';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { unsignedLinksSentBeforeMs } from '@/lib/release';

// Opt-out for the lead emails we send to unclaimed vendors (linked from the
// email footer and from the List-Unsubscribe header).
//
// GET never changes anything. It shows a page with one button. This matters:
// mail security gateways open every link in a message before a person sees
// it, and when opening the link WAS the opt-out, one scan silently cut a
// vendor off from every future couple.
//
// POST does the opt-out. It is sent by that button, or by a mail client's own
// "unsubscribe" control (RFC 8058 one-click, which posts to the link itself).
//
// The link is signed (src/lib/unsubscribe-link.ts), because vendor ids are
// public and an unsigned id would let anyone switch off any vendor's emails.
// Emails sent before the signature existed carry the bare id; those keep
// working until UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL, and only for vendors whose
// last email from us is from around the release that introduced signing, or
// older. A vendor emailed since then has a signed link in that email, so an
// unsigned request for them is not from us.
//
// A POST that opted nobody out says so (and answers 404), so neither a vendor
// nor a mail client's one-click button is told "done" when nothing happened.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIG_RE = /^[A-Za-z0-9_-]{20,100}$/;

function page(title: string, bodyHtml: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WeddingLiveStreaming.com</title></head>
     <body style="font-family:Georgia,serif;background:#FBF8F4;color:#251318;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
       <div style="max-width:420px;text-align:center;padding:24px">
         <h1 style="font-size:22px;font-weight:600">${title}</h1>
         ${bodyHtml}
       </div>
     </body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}

const SMALL = 'font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#6b5b60;line-height:1.6';

function donePage(): NextResponse {
  return page(
    'You won&rsquo;t receive any more quote request emails.',
    `<p style="${SMALL}">Your listing stays in the directory. Changed your mind? Claiming your free profile at
       <a href="https://www.weddinglivestreaming.com/claim" style="color:#761E34">weddinglivestreaming.com/claim</a>
       turns them back on.</p>`
  );
}

function invalidPage(status = 404): NextResponse {
  return page(
    'This link is no longer valid.',
    `<p style="${SMALL}">To stop these emails, write to
       <a href="mailto:hello@weddinglivestreaming.com" style="color:#761E34">hello@weddinglivestreaming.com</a>
       from the address that receives them and we will take care of it.</p>`,
    status
  );
}

/** Signed link, or an older unsigned one that is still inside its grace period. */
function accepted(v: string, s: string): 'signed' | 'unsigned' | null {
  if (!UUID_RE.test(v)) return null;
  if (s) return SIG_RE.test(s) && verifyUnsubscribe(s, v) ? 'signed' : null;
  return Date.now() < UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL ? 'unsigned' : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const v = params.get('v') ?? '';
  const s = params.get('s') ?? '';
  if (!accepted(v, s)) return invalidPage();

  return page(
    'Stop quote request emails?',
    `<p style="${SMALL}">We email you when a couple asks for a wedding livestream quote that matches your listing.
       Press the button and we will stop. Your listing stays in the directory.</p>
     <form method="post" action="/api/lead-notify/unsubscribe" style="margin:20px 0 0">
       <input type="hidden" name="v" value="${v}">
       <input type="hidden" name="s" value="${s}">
       <button type="submit" style="font-family:Helvetica,Arial,sans-serif;background:#761E34;color:#FBF8F4;border:0;padding:12px 24px;border-radius:999px;font-weight:600;font-size:15px;cursor:pointer">
         Stop these emails
       </button>
     </form>`
  );
}

export async function POST(request: Request) {
  if (isRateLimited('lead-unsubscribe', getClientIp(request), { windowMs: 10 * 60_000, maxRequests: 20 })) {
    return invalidPage(429);
  }

  // The confirmation form posts v and s in the body. A mail client's one-click
  // unsubscribe posts "List-Unsubscribe=One-Click" to the link itself, so v and
  // s are in the query string.
  const query = new URL(request.url).searchParams;
  let v = query.get('v') ?? '';
  let s = query.get('s') ?? '';
  try {
    const form = new URLSearchParams(await request.text());
    v = form.get('v') ?? v;
    s = form.get('s') ?? s;
  } catch {
    /* no readable body: the query string is all there is */
  }

  const kind = accepted(v, s);
  if (!kind) return invalidPage(400);

  const supabase = await createAdminClient();
  let update = supabase
    .from('vendor_private_contacts')
    .update({ opt_out: true, updated_at: new Date().toISOString() })
    .eq('vendor_id', v);
  // An unsigned link only exists in emails sent before links were signed.
  if (kind === 'unsigned') {
    update = update.lt('last_lead_notified_at', new Date(unsignedLinksSentBeforeMs()).toISOString());
  }
  const { data: changed, error } = await update.select('vendor_id');
  if (!error && (!changed || changed.length === 0)) return invalidPage(404);
  if (error) {
    console.error('[lead-unsubscribe] update failed', { message: error.message });
    return page(
      'That did not go through.',
      `<p style="${SMALL}">Please try again in a minute, or write to
         <a href="mailto:hello@weddinglivestreaming.com" style="color:#761E34">hello@weddinglivestreaming.com</a>
         and we will stop the emails for you.</p>`,
      500
    );
  }

  return donePage();
}
