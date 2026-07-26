import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a free WeddingLiveStreaming account to list your business or save vendors.',
  robots: { index: false, follow: false },
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams?.next && searchParams.next.startsWith('/') ? searchParams.next : '/dashboard';

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
          signInUrl="/auth/sign-in"
          forceRedirectUrl={next}
          fallbackRedirectUrl={next}
          appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-none border rounded-2xl' } }}
        />
      </div>
    </div>
  );
}
