import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/auth';
import { sendEmail, escapeHtml } from '@/lib/email';
import { maybeGrantFounding } from '@/lib/founding';
import { listingLiveEmail } from '@/lib/email-templates/vendor-lifecycle';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = await request.json();

  const supabase = await createClient();
  // One guard instead of two round trips. Returns null for signed-out AND
  // non-admin alike, so the response can't be used to probe who is an admin.
  const user = await getAdminProfile();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
  if (!status) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  // Read the row first so we only announce a listing the first time it goes
  // live, not on every re-approval.
  const { data: before } = await supabase
    .from('listings')
    .select('status, title, slug, vendor_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('listings').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Until now a vendor who submitted a listing never heard back: approval was
  // silent. Tell them it is live, and apply the founding-vendor offer if the
  // listing already has a price and a photo. Non-critical: the approval above
  // has committed, so nothing here may fail the request.
  const row = before as { status: string; title: string; slug: string; vendor_id: string | null } | null;
  if (status === 'approved' && row && row.status !== 'approved' && row.vendor_id) {
    try {
      const founding = await maybeGrantFounding(row.vendor_id);

      const admin = await createAdminClient();
      const { data: owner } = await admin
        .from('vendors')
        .select('user_id, profiles(email)')
        .eq('id', row.vendor_id)
        .maybeSingle();
      const ownerEmail = (owner as any)?.profiles?.email as string | undefined;

      // Seeded listings have no owner account, so there is nobody to email.
      if (ownerEmail) {
        await sendEmail({
          to: ownerEmail,
          ...listingLiveEmail({
            listingTitle: escapeHtml(row.title),
            listingSlug: row.slug,
            founding: founding.view,
          }),
        });
      }
    } catch (err) {
      console.error('[admin/listings] post-approval step failed', err);
    }
  }

  return NextResponse.json({ ok: true });
}
