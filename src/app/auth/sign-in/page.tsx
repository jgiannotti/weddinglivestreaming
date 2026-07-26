import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your WeddingLiveStreaming account.',
  robots: { index: false, follow: false },
};

/**
 * routing="hash" keeps every step of the flow (password, email code, passkey,
 * 2FA challenge, forgot-password) on this one URL. That's deliberate: it means
 * /auth/sign-in and /auth/register keep the exact paths they had under
 * Supabase Auth, so no inbound links, bookmarks, or redirects break.
 */
export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams?.next && searchParams.next.startsWith('/') ? searchParams.next : '/dashboard';

  return (
    <div className="container flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to manage your listings and leads.</p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/auth/register"
          forceRedirectUrl={next}
          fallbackRedirectUrl={next}
          appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-none border rounded-2xl' } }}
        />
      </div>
    </div>
  );
}
