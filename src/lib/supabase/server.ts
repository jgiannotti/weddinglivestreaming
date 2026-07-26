import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Request-scoped Supabase client, authorized by the caller's Clerk session.
 *
 * Deliberately keeps the same name and shape as the old @supabase/ssr version
 * so the ~40 call sites that only ever do `supabase.from(...)` did not have to
 * change during the Clerk migration. What changed is underneath: instead of
 * Supabase Auth cookies, we hand Supabase the Clerk session token via
 * `accessToken`. Postgres sees a normal `authenticated` role whose JWT `sub`
 * is the Clerk user id, which is what every RLS policy now resolves through
 * public.current_profile_id() (migration 0013).
 *
 * Signed out, getToken() returns null, the request is `anon`, and RLS falls
 * back to the public-read policies exactly as before.
 */
export async function createClient() {
  const { getToken } = await auth();

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => (await getToken()) ?? null,
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Service-role client. Bypasses RLS entirely — server-only, never import this
 * into a client component. Used for profile provisioning (ensureProfile),
 * webhooks, lead matching, and the seed scripts.
 */
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
