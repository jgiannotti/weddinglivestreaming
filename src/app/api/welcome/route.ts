import { NextResponse } from 'next/server';
import { ensureProfile } from '@/lib/auth';

// Safety net only. Profile provisioning and the one-time welcome email now
// happen inside ensureProfile() the first time a Clerk user hits any
// authenticated route, so this endpoint is idempotent and usually a no-op.
// Kept because the old register form still POSTs here on some cached clients.
export async function POST() {
  const profile = await ensureProfile();
  if (!profile) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json({ ok: true });
}
