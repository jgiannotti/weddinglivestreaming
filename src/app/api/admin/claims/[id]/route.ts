import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/claims/[id] — approve or reject a claim request.
// Approval runs through approve_claim_request() (migration 0008), which
// atomically attaches the claimant to the vendor, upgrades their role,
// and auto-rejects competing claims.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (action === 'approve') {
    const { error } = await supabase.rpc('approve_claim_request', { claim_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const { error } = await supabase.from('claim_requests').update({ status: 'rejected' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
