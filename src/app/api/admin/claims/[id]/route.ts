import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import { getAdminProfile } from '@/lib/auth';

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
    const { error } = await supabase.rpc('approve_claim_request', { claim_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Tell the claimant their profile is now theirs. Non-critical — approval
    // has already committed; sendEmail logs and swallows failures.
    const { data: claim } = await supabase
      .from('claim_requests')
      .select('user_id, listing:listings(title, slug), profile:profiles(email)')
      .eq('id', id)
      .single();
    const claimantEmail = (claim as any)?.profile?.email;
    const listing = (claim as any)?.listing;
    if (claimantEmail) {
      await sendEmail({
        to: claimantEmail,
        subject: 'Your vendor profile claim was approved 🎉',
        html: `
          <h2>Your profile is yours!</h2>
          <p>Your claim${listing?.title ? ` for <strong>${escapeHtml(listing.title)}</strong>` : ''} has been approved. You now manage this listing.</p>
          <p><a href="https://weddinglivestreaming.com/dashboard">Open your dashboard</a>${listing?.slug ? ` · <a href="https://weddinglivestreaming.com/listing/${listing.slug}">View your public listing</a>` : ''}</p>
        `,
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
