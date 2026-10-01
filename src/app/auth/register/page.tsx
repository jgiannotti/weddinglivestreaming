import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';
import { safeNextPath } from '@/lib/safe-next';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a free WeddingLiveStreaming account to list your business or save vendors.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
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
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Create your account</h1>
          <p className="text-muted-foreground">
            Free to join. Claim your listing, respond to couples, and manage your profile.
          </p>
        </div>
        <SignUp
          routing="hash"
          // Carries the return path across "Already have an account? Sign in",
          // so a vendor who arrived on a claim link does not lose it by
          // switching cards.
          signInUrl={`/auth/sign-in?next=${encodeURIComponent(next)}`}
          forceRedirectUrl={next}
          fallbackRedirectUrl={next}
          appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-none border rounded-2xl' } }}
        />
      </div>
    </div>
  );
}
