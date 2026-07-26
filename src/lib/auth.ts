import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from './supabase/server';
import { sendWelcomeIfNeeded } from './welcome';

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'couple' | 'vendor' | 'admin';
  welcome_sent_at: string | null;
};

/**
 * Resolve the Clerk caller to their row in public.profiles, creating or
 * adopting one if needed. This replaces the old `on_auth_user_created`
 * Postgres trigger (0007/0010), which could only fire on Supabase Auth
 * signups and is dropped in 0013.
 *
 * Runs with the service-role client on purpose: profiles has no INSERT policy
 * for `authenticated`, so a user can never fabricate their own profile row —
 * and therefore never fabricate a role. Provisioning is server-only.
 *
 * Returns null when signed out, or when Clerk has no verified email for the
 * account yet (email verification is required at sign-up, so this is a
 * transient state, not a normal one).
 */
export async function ensureProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const admin = await createAdminClient();

  // Fast path: already linked.
  const { data: linked } = await admin
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (linked) return linked as Profile;

  const user = await currentUser();
  if (!user) return null;

  // SECURITY: only ever trust an email Clerk has actually verified. The
  // adoption step below hands over an existing profile — including Joe's
  // admin row — to whoever proves control of that address. An unverified
  // address would make admin takeover a matter of typing the right email.
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== 'verified') return null;
  const email = primary.emailAddress.toLowerCase();

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || null;

  // Adopt a pre-Clerk profile with the same verified address. This is what
  // carries the admin role, vendor ownership, listings, and message history
  // across the migration without touching a single foreign key.
  const { data: orphan } = await admin
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .is('clerk_user_id', null)
    .maybeSingle();

  if (orphan) {
    const { data: adopted } = await admin
      .from('profiles')
      .update({
        clerk_user_id: userId,
        display_name: (orphan as Profile).display_name ?? displayName,
      })
      .eq('id', (orphan as Profile).id)
      .is('clerk_user_id', null) // lose the race rather than steal the row
      .select()
      .maybeSingle();
    if (adopted) return adopted as Profile;
  }

  // Brand new account.
  const { data: created, error } = await admin
    .from('profiles')
    .insert({ clerk_user_id: userId, email, display_name: displayName })
    .select()
    .maybeSingle();

  if (created) {
    // First-ever sign-in. This is where the welcome email fires now that the
    // on_auth_user_created trigger is gone — creation happens exactly once
    // per Clerk account, and sendWelcomeIfNeeded is itself guarded by
    // profiles.welcome_sent_at, so a retry can't double-send.
    await sendWelcomeIfNeeded({ id: (created as Profile).id, email: (created as Profile).email });
    return created as Profile;
  }

  // Unique-index collision means a concurrent request won the race; read theirs.
  if (error) {
    const { data: raced } = await admin
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (raced) return raced as Profile;
  }

  return null;
}

/** Server-component guard: signed in with a provisioned profile, or bounce. */
export async function requireProfile(next = '/dashboard'): Promise<Profile> {
  const profile = await ensureProfile();
  if (!profile) redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  return profile;
}

/** Server-component guard for /admin and every /api/admin route. */
export async function requireAdmin(next = '/admin'): Promise<Profile> {
  const profile = await requireProfile(next);
  if (profile.role !== 'admin') redirect('/');
  return profile;
}

/** Non-redirecting variant for API routes, which must answer with a status. */
export async function getAdminProfile(): Promise<Profile | null> {
  const profile = await ensureProfile();
  return profile?.role === 'admin' ? profile : null;
}
