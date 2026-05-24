import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetForm } from './reset-form';

export const metadata: Metadata = { title: 'Reset Password' };

export default function ResetPage() {
  return (
    <div className="container max-w-md py-20">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Reset password</h1>
        <p className="text-muted-foreground">We&rsquo;ll email you a link to set a new one.</p>
      </div>
      <ResetForm />
      <div className="mt-8 text-center text-sm">
        Remembered it?{' '}
        <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
