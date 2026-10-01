import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { maybeGrantFounding } from '@/lib/founding';
import { getMyVendor } from '@/lib/data/my-vendor';

// POST /api/founding — apply the founding-vendor offer to the signed-in
// vendor if their listing qualifies right now. Called after a listing edit
// (the moment a vendor adds the missing price or photo) and by the "turn it
// on" button on the dashboard. Idempotent: it grants at most once per vendor.
//
// The grant itself runs with the service role inside maybeGrantFounding(); a
// vendor must never be able to set their own tier from the browser.
export async function POST() {
  const profile = await ensureProfile();
  if (!profile) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const supabase = await createClient();
  const vendor = await getMyVendor(supabase, profile.id);

  if (!vendor) return NextResponse.json({ granted: false, state: 'none' });

  const result = await maybeGrantFounding(vendor.id);
  return NextResponse.json({
    granted: result.granted,
    state: result.view.state,
    until: result.until ?? null,
    missing: result.view.state === 'incomplete' ? result.view.missing : [],
  });
}
