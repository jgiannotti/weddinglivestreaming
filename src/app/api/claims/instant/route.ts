import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { verifyClaimToken } from '@/lib/claim-link';
import { maybeGrantFounding } from '@/lib/founding';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { claimApprovedEmail } from '@/lib/email-templates/vendor-lifecycle';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { emailSiteUrl } from '@/lib/site-url';
import { ownedVendors, deleteEmptyVendorRows } from '@/lib/data/my-vendor';

// POST /api/claims/instant — approve a claim on the spot when the claimant
// arrives through a signed claim link (src/lib/claim-link.ts). Those links go
// out in the lead email to the business's own published address, and the
// owner can copy one from /admin/vendors to send by hand. Possession of the
// link is the proof of ownership, so there is nothing left for a human to
// review. The owner is told about every one (see the FYI email below).
//
// An expired link is sent back to the normal manual claim form
// (`fallback: true`) rather than failing.
//
// Runs with the service-role client because the writes are exactly the ones
// approve_claim_request() (migration 0008) performs as an admin: attach the
// claimant to the vendor, promote their role, record the claim, and close out
// competing claims. The conditional update on vendors.user_id is what makes it
// race-safe: only one request can move a vendor from unowned to owned.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INSTANT_DETAILS =
  'Approved automatically: claimed through a signed claim link (emailed to the business, or sent by the site owner).';

function domainOf(address: string | null | undefined): string {
  return (address ?? '').split('@')[1]?.trim().toLowerCase() ?? '';
}

// Two addresses at one of these say nothing about being the same business.
const PUBLIC_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'comcast.net', 'att.net', 'verizon.net',
]);

/** How the claimant's address relates to the one on file, for the owner's FYI. */
function addressMatch(onFile: string | null, claimant: string | null | undefined): 'same' | 'same-business-domain' | 'different' {
  const a = (onFile ?? '').trim().toLowerCase();
  const b = (claimant ?? '').trim().toLowerCase();
  if (!a || !b) return 'different';
  if (a === b) return 'same';
  const domain = domainOf(a);
  return domain && domain === domainOf(b) && !PUBLIC_MAIL_DOMAINS.has(domain) ? 'same-business-domain' : 'different';
}

export async function POST(request: Request) {
  if (isRateLimited('claims-instant', getClientIp(request), { windowMs: 10 * 60_000, maxRequests: 10 })) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });
  }

  const profile = await ensureProfile();
  if (!profile) {
    return NextResponse.json({ error: 'You must be signed in to claim a profile.' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const listingId = typeof body.listing_id === 'string' ? body.listing_id : '';
  const token = typeof body.token === 'string' ? body.token : '';
  if (!UUID_RE.test(listingId) || !token) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const admin = await createAdminClient();

  const { data: listingRow } = await admin
    .from('listings')
    .select('id, title, slug, vendor_id')
    .eq('id', listingId)
    .eq('status', 'approved')
    .maybeSingle();
  const listing = listingRow as { id: string; title: string; slug: string; vendor_id: string } | null;
  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });

  if (!verifyClaimToken(token, listing.vendor_id)) {
    return NextResponse.json(
      {
        error:
          'This claim link has expired. You can still claim the profile with the form below. We review those by hand, usually within 1 business day.',
        fallback: true,
      },
      { status: 403 }
    );
  }

  // One account, one vendor. Every dashboard page works on a single vendor,
  // so a second one on the same account cannot be shown or managed. An empty
  // vendor row left by an interrupted sign-up does not count: it is cleared
  // away below once the claim has gone through.
  const { real: owned, empty: emptyRows, failed: ownedUnknown } = await ownedVendors(admin, profile.id);
  if (ownedUnknown) {
    return NextResponse.json({ error: 'Could not complete your claim. Please try again.' }, { status: 500 });
  }
  if (owned.some((v) => v.id === listing.vendor_id)) {
    // They already own this one: a second tap, or a retry after the first
    // answer was lost on the way back. That is a success, not an error.
    const { count } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .contains('matched_vendor_ids', [listing.vendor_id]);
    return NextResponse.json({ ok: true, waitingLeads: count || 0, founding: 'none', already: true });
  }
  if (owned.length > 0) {
    return NextResponse.json(
      {
        error: `This account already manages ${owned[0].business_name || 'another business'}. One account manages one business, so to claim this one, sign in with a different email address or write to hello@weddinglivestreaming.com.`,
      },
      { status: 409 }
    );
  }

  const { data: target } = await admin.from('vendors').select('user_id').eq('id', listing.vendor_id).maybeSingle();
  if ((target as { user_id: string | null } | null)?.user_id) {
    return NextResponse.json({ error: 'This profile has already been claimed.' }, { status: 409 });
  }

  // A link works once per profile. If this profile was claimed before and the
  // claim was undone (the wrong person had the link), the same link must not
  // hand it straight back: that claim goes to a person.
  const { data: vendorListingRows } = await admin.from('listings').select('id').eq('vendor_id', listing.vendor_id);
  const vendorListingIds = ((vendorListingRows as { id: string }[] | null) ?? []).map((l) => l.id);
  const { data: earlier } = await admin
    .from('claim_requests')
    .select('id')
    .eq('status', 'approved')
    .in('listing_id', vendorListingIds.length > 0 ? vendorListingIds : [listing.id])
    .limit(1);
  if (earlier && earlier.length > 0) {
    return NextResponse.json(
      {
        error:
          'This profile has been claimed before, so this claim needs a quick check by a person. Use the form below. We review those by hand, usually within 1 business day.',
        fallback: true,
      },
      { status: 403 }
    );
  }

  const nowIso = new Date().toISOString();
  const { data: attached, error: attachErr } = await admin
    .from('vendors')
    .update({ user_id: profile.id, claimed_at: nowIso, updated_at: nowIso })
    .eq('id', listing.vendor_id)
    .is('user_id', null)
    .select('id, business_name');

  if (attachErr) {
    console.error('[claims/instant] attach failed', {
      message: attachErr.message,
      userId: profile.id,
      listingId,
    });
    return NextResponse.json({ error: 'Could not complete your claim. Please try again.' }, { status: 500 });
  }
  if (!attached || attached.length === 0) {
    return NextResponse.json({ error: 'This profile has already been claimed.' }, { status: 409 });
  }
  const businessName = (attached[0] as { business_name: string | null }).business_name || listing.title;

  // From here on the claim has succeeded. Everything below is bookkeeping and
  // notification; none of it may turn a successful claim into an error.
  let waitingLeads = 0;
  let foundingState = 'none';
  try {
    await admin.from('profiles').update({ role: 'vendor' }).eq('id', profile.id).eq('role', 'couple');

    // Leftovers from an interrupted sign-up on this account: vendor rows with
    // no listing. With a real profile now attached they are only confusion.
    await deleteEmptyVendorRows(profile.id, emptyRows.map((v) => v.id));

    const listingIds = vendorListingIds;

    // If this person already had a manual claim waiting, approve that row
    // instead of leaving it pending beside a new one.
    const { data: ownPending } = await admin
      .from('claim_requests')
      .update({ status: 'approved' })
      .eq('status', 'pending')
      .eq('user_id', profile.id)
      .in('listing_id', listingIds)
      .select('id');
    if (!ownPending || ownPending.length === 0) {
      await admin.from('claim_requests').insert({
        listing_id: listing.id,
        user_id: profile.id,
        details: INSTANT_DETAILS,
        status: 'approved',
      });
    }

    // Competing pending claims on this vendor lose, as in approve_claim_request().
    await admin
      .from('claim_requests')
      .update({ status: 'rejected' })
      .eq('status', 'pending')
      .neq('user_id', profile.id)
      .in('listing_id', listingIds);

    const founding = await maybeGrantFounding(listing.vendor_id);
    foundingState = founding.view.state;

    const { count } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .contains('matched_vendor_ids', [listing.vendor_id]);
    waitingLeads = count || 0;

    // Who we mailed the link to, next to who used it. They often differ for
    // good reasons (an owner signing up with a personal address), but a
    // mismatch is the thing worth a glance.
    const { data: contact } = await admin
      .from('vendor_private_contacts')
      .select('public_email')
      .eq('vendor_id', listing.vendor_id)
      .maybeSingle();
    const mailedTo = (contact as { public_email: string | null } | null)?.public_email ?? null;
    const match = addressMatch(mailedTo, profile.email);
    const mailedLine = mailedTo
      ? `<strong>Address on file for this business:</strong> ${escapeHtml(mailedTo)}${
          match === 'same'
            ? ' (the same address the claimant signed up with)'
            : match === 'same-business-domain'
              ? ' (same business domain as the claimant)'
              : ' <strong>(different from the claimant&rsquo;s address. Usually an owner using a personal email, but worth a look.)</strong>'
        }<br/>`
      : '<strong>Address on file for this business:</strong> none (the link was one you copied)<br/>';
    const site = emailSiteUrl();

    await Promise.allSettled([
      profile.email
        ? sendEmail({
            to: profile.email,
            ...claimApprovedEmail({
              listingTitle: escapeHtml(listing.title),
              listingSlug: listing.slug,
              waitingLeads,
              founding: founding.view,
            }),
          })
        : Promise.resolve(false),
      // Owner FYI. Nothing to approve, but a human should still see every
      // change of ownership go by.
      sendEmail({
        to: ADMIN_EMAIL,
        replyTo: profile.email || undefined,
        subject: `Profile claimed instantly: ${businessName}`,
        html: `
          <h2>A vendor claimed their profile through a claim link</h2>
          <p><strong>Business:</strong> ${escapeHtml(businessName)}<br/>
          <strong>Claimed by:</strong> ${escapeHtml(profile.email || profile.id)}<br/>
          ${mailedLine}
          <strong>Quote requests waiting for them:</strong> ${waitingLeads}</p>
          <p>Nothing to approve. The claim went through automatically because it came through a signed claim link: the one we emailed to this business, or one you sent them yourself. If this does not look like the right person, ask Claude to undo the claim soon: the new owner can see this business&rsquo;s quote requests.</p>
          <p><a href="${site}/listing/${listing.slug}">View the listing</a> · <a href="${site}/admin/vendors">Vendors</a></p>
        `,
      }),
    ]);
  } catch (err) {
    console.error('[claims/instant] post-claim step failed', err);
  }

  return NextResponse.json({ ok: true, waitingLeads, founding: foundingState });
}
