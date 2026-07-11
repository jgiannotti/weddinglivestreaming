import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// One-click opt-out for unclaimed-vendor lead notifications (linked from the
// email footer). The "token" is the vendor's UUID — not guessable in practice,
// and the worst an attacker with a leaked UUID can do is stop notifications
// for that vendor, which is a safe failure mode.
//
// GET so it works from any mail client. Always returns a friendly page and
// never reveals whether the id matched anything.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(message: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>WeddingLiveStreaming.com</title></head>
     <body style="font-family:Georgia,serif;background:#FBF8F4;color:#251318;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
       <div style="max-width:420px;text-align:center;padding:24px">
         <h1 style="font-size:22px;font-weight:600">${message}</h1>
         <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#6b5b60">
           Changed your mind? Claiming your free profile at
           <a href="https://www.weddinglivestreaming.com/claim" style="color:#761E34">weddinglivestreaming.com/claim</a>
           always re-enables direct inquiries.
         </p>
       </div>
     </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(request: Request) {
  const v = new URL(request.url).searchParams.get('v') ?? '';
  if (UUID_RE.test(v)) {
    const supabase = await createAdminClient();
    await supabase
      .from('vendor_private_contacts')
      .update({ opt_out: true, updated_at: new Date().toISOString() })
      .eq('vendor_id', v);
  }
  return page("You won't receive any more inquiry notifications.");
}
