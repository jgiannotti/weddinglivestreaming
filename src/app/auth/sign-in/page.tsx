import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './sign-in-form';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Sign In' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="container max-w-md py-20">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to manage your listing or messages.</p>
      </div>

      <Card className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {decodeURIComponent(error)}
          </div>
        )}

        <SignInForm next={next} />
      </Card>

      <div className="mt-8 space-y-3 text-center text-sm">
        <p>
          Don&rsquo;t have an account?{' '}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
        <p>
          <Link href="/auth/reset" className="text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
