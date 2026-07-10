import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Register' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only allow same-site relative redirects.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;

  return (
    <div className="container max-w-md py-20">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Create your account</h1>
        <p className="text-muted-foreground">It only takes a minute.</p>
      </div>

      <Card className="p-6 md:p-8">
        <RegisterForm next={safeNext} />
      </Card>

      <div className="mt-8 text-center text-sm">
        Already have an account?{' '}
        <Link
          href={safeNext ? `/auth/sign-in?next=${encodeURIComponent(safeNext)}` : '/auth/sign-in'}
          className="text-primary font-medium hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
