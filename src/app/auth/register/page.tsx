import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterPage() {
  return (
    <div className="container max-w-md py-20">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Create your account</h1>
        <p className="text-muted-foreground">It only takes a minute.</p>
      </div>

      <RegisterForm />

      <div className="mt-8 text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
