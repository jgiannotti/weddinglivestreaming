import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import { safeNextPath } from '@/lib/safe-next';

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
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Next 15 passes searchParams as a Promise. Reading it synchronously still
  // worked through a compatibility shim, but that shim is deprecated, and the
  // `next` value now carries the signed claim link through sign-up, so it has
  // to be read the supported way. safeNextPath() makes sure `next` can only
  // ever point back into this site.
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext);

  return (
    <div className="container flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to manage your listings and leads.</p>
        </div>
        <SignIn
          routing="hash"
          // Carries the return path across "Don't have an account? Sign up".
          signUpUrl={`/auth/register?next=${encodeURIComponent(next)}`}
          forceRedirectUrl={next}
          fallbackRedirectUrl={next}
          appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-none border rounded-2xl' } }}
        />
      </div>
    </div>
  );
}
