import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { ensureProfile } from '@/lib/auth';

// POST /api/claims — submit a claim for a seeded (unclaimed) vendor profile.
export async function POST(request: Request) {
  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return NextResponse.json({ error: 'You must be signed in to claim a profile.' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const listingId = typeof body.listing_id === 'string' ? body.listing_id : null;
  const businessEmail = typeof body.business_email === 'string' ? body.business_email.trim().slice(0, 200) : '';
  const businessPhone = typeof body.business_phone === 'string' ? body.business_phone.trim().slice(0, 40) : '';
  const proof = typeof body.proof === 'string' ? body.proof.trim().slice(0, 2000) : '';

  if (!listingId || !businessEmail || !proof) {
    return NextResponse.json({ error: 'Business email and verification details are required.' }, { status: 400 });
  }

  // The listing must exist, be public, and belong to an UNCLAIMED vendor.
  const { data: listing } = await supabase
    .from('listings')
    .select('id, vendor:vendors(id, user_id)')
    .eq('id', listingId)
    .eq('status', 'approved')
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  const vendor = (listing as any).vendor;
  if (!vendor || vendor.user_id) {
    return NextResponse.json({ error: 'This profile has already been claimed.' }, { status: 409 });
  }

  // One pending claim per user per listing.
  const { data: existing } = await supabase
    .from('claim_requests')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You already have a claim pending for this profile.' }, { status: 409 });
  }

  const details = [
    `Business email: ${businessEmail}`,
    businessPhone ? `Business phone: ${businessPhone}` : null,
    `Proof: ${proof}`,
  ]
    .filter(Boolean)
    .join('\n');

  const { error } = await supabase.from('claim_requests').insert({
    listing_id: listingId,
    user_id: user.id,
    details,
    status: 'pending',
  });

  if (error) {
    // Surface the real failure in Vercel runtime logs. Swallowing it hid a
    // total claim outage for three weeks; never let this fail silently again.
    console.error('[claims] insert failed', {
      code: (error as any).code,
      message: error.message,
      userId: user.id,
      listingId,
    });
    return NextResponse.json({ error: 'Could not submit your claim. Please try again.' }, { status: 500 });
  }

  // Owner alert — claims need manual review in /admin/claims.
  await sendEmail({
    to: ADMIN_EMAIL,
    replyTo: user.email || undefined,
    subject: 'New profile claim awaiting review',
    html: `
      <h2>New claim request</h2>
      <p><strong>Claimant:</strong> ${escapeHtml(user.email || user.id)}</p>
      <p style="white-space:pre-line">${escapeHtml(details)}</p>
      <p><a href="https://www.weddinglivestreaming.com/admin/claims">Review in the claims queue</a></p>
    `,
  });

  return NextResponse.json({ ok: true });
}
