'use client';

import { useMemo } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

/**
 * Browser-side Supabase client authorized by the current Clerk session.
 *
 * Must be a hook now (it was a plain function pre-Clerk) because the token
 * comes from Clerk's React context rather than a cookie the SDK could read on
 * its own. Client components that write data — submit-listing, listing edit —
 * call `const supabase = useSupabase()` and are otherwise unchanged.
 */
export function useSupabase() {
  const { session } = useSession();

  return useMemo(
    () =>
      createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          // Same 'supabase' JWT template as the server client: adds the
          // {"role": "authenticated"} claim PostgREST needs. See server.ts.
          accessToken: async () => (await session?.getToken({ template: 'supabase' })) ?? null,
          auth: { persistSession: false, autoRefreshToken: false },
        }
      ),
    [session]
  );
}

/**
 * Unauthenticated browser client for public reads (directory search, map).
 * Anonymous role only — RLS gives it the same access a logged-out visitor has.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
