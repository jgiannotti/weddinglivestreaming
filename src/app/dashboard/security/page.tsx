import type { Metadata } from 'next';
import { UserProfile } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Account security',
  robots: { index: false, follow: false },
};

/**
 * Replaces the hand-rolled TOTP enrolment UI (two-factor-manager.tsx) built
 * against supabase.auth.mfa. Clerk's UserProfile ships authenticator-app 2FA,
 * backup codes, passkeys, connected accounts, and active-session management,
 * all of which are enabled on the instance.
 */
export default function SecurityPage() {
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Account &amp; security</h1>
      <p className="text-muted-foreground mb-8">
        Manage your sign-in methods, two-factor authentication, and active devices.
      </p>
      <UserProfile
        routing="hash"
        appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full max-w-none shadow-none border rounded-2xl' } }}
      />
    </div>
  );
}
