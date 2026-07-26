import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // One guard instead of two round trips. Returns null for signed-out AND
  // non-admin alike, so the response can't be used to probe who is an admin.
  const user = await getAdminProfile();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Safety check: refuse to delete a category still attached to listings,
  // since listing_categories has no cascading UI to clean up after us.
  const { count } = await supabase
    .from('listing_categories')
    .select('category_id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Category is used by one or more listings and cannot be deleted' },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
