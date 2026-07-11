import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeIfNeeded } from '@/lib/welcome';

// Fired by the register form when signup returns an immediate session (i.e.
// email confirmation is disabled in Supabase, so /auth/callback never runs).
// Idempotent — the send is guarded by profiles.welcome_sent_at.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  await sendWelcomeIfNeeded(user);
  return NextResponse.json({ ok: true });
}
