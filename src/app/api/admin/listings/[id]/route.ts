import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/auth';

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

  const { error } = await supabase.from('listings').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
