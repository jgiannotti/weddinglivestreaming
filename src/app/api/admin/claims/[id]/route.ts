import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import { getAdminProfile } from '@/lib/auth';
import { maybeGrantFounding } from '@/lib/founding';
import { claimApprovedEmail } from '@/lib/email-templates/vendor-lifecycle';
import { ownedVendors, deleteEmptyVendorRows } from '@/lib/data/my-vendor';

// PATCH /api/admin/claims/[id] — approve or reject a claim request.
// Approval runs through approve_claim_request() (migration 0008), which
// atomically attaches the claimant to the vendor, upgrades their role,
// and auto-rejects competing claims.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = await request.json();

  const supabase = await createClient();
  // One guard instead of two round trips. Returns null for signed-out AND
  // non-admin alike, so the response can't be used to probe who is an admin.
  const user = await getAdminProfile();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (action === 'approve') {
    // One account, one vendor. A claim filed before that rule was enforced at
    // submission could still be waiting here; approving it would leave the
    // account with two vendors, which no dashboard page can show.
    const { data: pending } = await supabase
      .from('claim_requests')
      .select('user_id, listing:listings(vendor_id)')
      .eq('id', id)
      .maybeSingle();
    const claimantId = (pending as any)?.user_id as string | undefined;
    const targetVendorId = (pending as any)?.listing?.vendor_id as string | undefined;
    let emptyVendorIds: string[] = [];
    if (claimantId) {
      // Only vendors with a listing count as "already manages a business".
      const { real, empty, failed } = await ownedVendors(supabase, claimantId);
      if (failed) {
        return NextResponse.json(
          { error: 'Could not check which business this account already manages. Nothing was changed. Please try again.' },
          { status: 500 }
        );
      }
      emptyVendorIds = empty.map((v) => v.id).filter((vendorId) => vendorId !== targetVendorId);
      const other = real.find((v) => v.id !== targetVendorId);
      if (other) {
        return NextResponse.json(
          {
            error: `This account already manages ${other.business_name || 'another business'}. One account manages one business, so this claim cannot be approved. Reject it, or ask them to claim with a different email address.`,
          },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase.rpc('approve_claim_request', { claim_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Clear away empty vendor rows an interrupted sign-up left on the account.
    if (claimantId) await deleteEmptyVendorRows(claimantId, emptyVendorIds);

    // Tell the claimant their profile is now theirs. Non-critical — approval
    // has already committed; sendEmail logs and swallows failures.
    const { data: claim } = await supabase
      .from('claim_requests')
      .select('user_id, listing:listings(title, slug, vendor_id), profile:profiles(email)')
      .eq('id', id)
      .single();
    const claimantEmail = (claim as any)?.profile?.email;
    const listing = (claim as any)?.listing;

    // Leads already matched to this vendor make the approval email an
    // immediate call to action instead of a shrug. Count failures are
    // non-critical — worst case the email just omits the line.
    let waitingLeads = 0;
    let founding = null;
    if (listing?.vendor_id) {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .contains('matched_vendor_ids', [listing.vendor_id]);
      waitingLeads = count || 0;

      // Founding-vendor offer: applies immediately if the listing already has
      // a price and a photo, otherwise the email explains what is missing.
      founding = (await maybeGrantFounding(listing.vendor_id)).view;
    }

    if (claimantEmail) {
      await sendEmail({
        to: claimantEmail,
        ...claimApprovedEmail({
          listingTitle: listing?.title ? escapeHtml(listing.title) : null,
          listingSlug: listing?.slug ?? null,
          waitingLeads,
          founding,
        }),
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const { error } = await supabase.from('claim_requests').update({ status: 'rejected' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
