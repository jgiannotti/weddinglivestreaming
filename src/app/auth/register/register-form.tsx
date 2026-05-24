'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'couple' | 'vendor'>('couple');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }
      // If email confirmation is on, show confirmation message; otherwise redirect
      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        router.push(role === 'vendor' ? '/submit-listing' : '/dashboard');
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
      <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
        <button
          type="button"
          onClick={() => setRole('couple')}
          className={`py-2 rounded-md text-sm font-medium transition-colors ${
            role === 'couple' ? 'bg-card shadow' : 'text-muted-foreground'
          }`}
        >
          I&rsquo;m a couple
        </button>
        <button
          type="button"
          onClick={() => setRole('vendor')}
          className={`py-2 rounded-md text-sm font-medium transition-colors ${
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
        <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
