// One-time welcome email for new accounts (server-only).
//
// Called from /auth/callback (Google OAuth + email-confirmation links) and
// /api/welcome (email/password signups that get an immediate session when
// confirmation is disabled). Safe to call on every sign-in: the send is
// guarded by profiles.welcome_sent_at, claimed atomically so concurrent
// requests can never double-send.

import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import { welcomeAccountEmail } from '@/lib/email-templates/welcome-account';

export async function sendWelcomeIfNeeded(user: Pick<User, 'id' | 'email' | 'user_metadata'>): Promise<void> {
  if (!user.email) return;

  try {
    const admin = await createAdminClient();

    // Atomically claim the send: only one request can flip NULL → now().
    // (The signup trigger creates the profile row before the user can ever
    // reach a callback, so the row always exists by this point.)
    const { data: claimed, error } = await admin
      .from('profiles')
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('welcome_sent_at', null)
      .select('display_name, role')
      .maybeSingle();

    if (error) {
      console.error('[welcome] claim failed:', error);
      return;
    }
    if (!claimed) return; // already sent (or claimed by a concurrent request)

    // Prefer the role chosen on the register form (user metadata); profiles.role
    // only becomes 'vendor' later, when a listing is submitted. Google signups
    // carry no metadata role and default to the couple version.
    const metaRole = user.user_metadata?.role;
    const role = metaRole === 'vendor' ? 'vendor' : (claimed.role as 'couple' | 'vendor' | 'admin') ?? 'couple';
    const displayName = claimed.display_name || user.user_metadata?.display_name || null;

    const sent = await sendEmail({
      to: user.email,
      ...welcomeAccountEmail({
        displayName: displayName ? escapeHtml(displayName) : null,
        role,
      }),
    });

    // Release the claim on failure (including missing RESEND_API_KEY) so the
    // next sign-in retries instead of silently never welcoming the user.
    if (!sent) {
      await admin
        .from('profiles')
        .update({ welcome_sent_at: null })
        .eq('id', user.id);
    }
  } catch (err) {
    // Welcome email must never break sign-in.
    console.error('[welcome] threw:', err);
  }
}
