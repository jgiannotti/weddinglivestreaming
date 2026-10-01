import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { emailSiteUrl } from '@/lib/site-url';

// POST /api/listings/submitted — tell the owner a vendor just submitted a
// listing for review.
//
// The submit form writes straight to Supabase from the browser, so until this
// route existed nothing told anyone a listing was waiting: the form promised
// "live within 24 hours" and the listing sat in /admin/listings until someone
// happened to look. New leads and new claims already alerted the owner; new
// listings (the vendors keenest to be on the site) did not.
//
// The listing is read back through the caller's own RLS identity, so a vendor
// can only ever trigger an alert about a pending listing they really own.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (isRateLimited('listing-submitted', getClientIp(request), { windowMs: 10 * 60_000, maxRequests: 5 })) {
    return NextResponse.json({ ok: true });
  }

  const profile = await ensureProfile();
  if (!profile) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const listingId = typeof body.listing_id === 'string' ? body.listing_id : '';
  if (!UUID_RE.test(listingId)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('listings')
    .select('id, title, city, state, status, website_url, starting_price_cents, hero_image_url, vendor:vendors(user_id)')
    .eq('id', listingId)
    .maybeSingle();

  const listing = data as any;
  if (!listing || listing.vendor?.user_id !== profile.id) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }
  // Only a listing that is actually waiting needs a human.
  if (listing.status !== 'pending') return NextResponse.json({ ok: true });

  const where = [listing.city, listing.state].filter(Boolean).join(', ');
  await sendEmail({
    to: ADMIN_EMAIL,
    replyTo: profile.email || undefined,
    subject: `New listing awaiting review: ${listing.title}${where ? ` (${where})` : ''}`,
    html: `
      <h2>A vendor submitted a new listing</h2>
      <p><strong>Business:</strong> ${escapeHtml(String(listing.title))}<br/>
      <strong>Location:</strong> ${escapeHtml(where || 'not given')}<br/>
      <strong>Website:</strong> ${listing.website_url ? escapeHtml(String(listing.website_url)) : 'none given'}<br/>
      <strong>Submitted by:</strong> ${escapeHtml(profile.email || profile.id)}<br/>
      <strong>Starting price:</strong> ${listing.starting_price_cents != null ? 'yes' : 'not yet'} ·
      <strong>Cover photo:</strong> ${listing.hero_image_url ? 'yes' : 'not yet'}</p>
      <p>The form told them we review new listings by hand, usually within 24 hours. Approving it emails them that it is live.</p>
      <p><a href="${emailSiteUrl()}/admin/listings">Review it in the listings queue</a></p>
    `,
  });

  return NextResponse.json({ ok: true });
}
