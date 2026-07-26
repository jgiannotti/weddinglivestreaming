import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/auth';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const user = await getAdminProfile();
  if (!user) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { error: null };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { error: authError } = await requireAdmin(supabase);
  if (authError) return authError;

  const { name, slug } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const { error } = await supabase.from('categories').insert({ name, slug });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
