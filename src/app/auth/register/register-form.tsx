'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export function RegisterForm({ next }: { next?: string } = {}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'couple' | 'vendor'>('couple');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function passwordProblem(pw: string): string | null {
    // Mirrors the server-side policy (Supabase: min 8, lower + upper + digit)
    // so users get instant, friendly feedback instead of a server error.
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter.';
    if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter.';
    if (!/[0-9]/.test(pw)) return 'Password must include a number.';
    return null;
  }

  function friendlyError(message: string): string {
    if (/rate limit/i.test(message)) {
      return 'Too many signup attempts right now — please wait a minute and try again.';
    }
    if (/already registered/i.test(message)) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwIssue = passwordProblem(password);
    if (pwIssue) {
      setError(pwIssue);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, role },
          emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
        },
      });
      if (signUpErr) {
        setError(friendlyError(signUpErr.message));
        setLoading(false);
        return;
      }
      // Supabase anti-enumeration: signing up with an email that already has an
      // account returns a fake success with an empty identities array. Catch it
      // so people aren't left waiting for a confirmation email that never comes.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try signing in instead — or use "Forgot password?" if you can’t get in.');
        setLoading(false);
        return;
      }
      // If email confirmation is on, show confirmation message; otherwise redirect
      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        // `next` (e.g. a claim-profile flow) outranks the default landing.
        router.push(next || (role === 'vendor' ? '/submit-listing' : '/dashboard'));
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-6 rounded-xl bg-accent/40 border text-center">
        <p className="font-semibold mb-2">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-muted">
        <button
          type="button"
          onClick={() => setRole('couple')}
          className={`py-2 rounded-full text-sm font-medium transition-colors ${
            role === 'couple' ? 'bg-card shadow' : 'text-muted-foreground'
          }`}
        >
          I&rsquo;m a couple
        </button>
        <button
          type="button"
          onClick={() => setRole('vendor')}
          className={`py-2 rounded-full text-sm font-medium transition-colors ${
            role === 'vendor' ? 'bg-card shadow' : 'text-muted-foreground'
          }`}
        >
          I&rsquo;m a vendor
        </button>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          {role === 'vendor' ? 'Business name' : 'Your name'}
        </label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
        <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="mt-1 text-xs text-muted-foreground">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
