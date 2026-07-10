'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { GoogleButton, OrDivider } from '@/components/auth/google-button';
import { Loader2, ShieldCheck } from 'lucide-react';

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // MFA step (shown only when the account has 2FA enabled)
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  function friendlyError(message: string): string {
    if (/invalid login credentials/i.test(message)) {
      return 'Email or password is incorrect.';
    }
    if (/email not confirmed/i.test(message)) {
      return 'Your email isn’t confirmed yet — check your inbox for the confirmation link.';
    }
    return message;
  }

  async function finishSignIn() {
    router.push(next || '/dashboard');
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(friendlyError(signInErr.message));
        setLoading(false);
        return;
      }

      // If this account has 2FA turned on, ask for the code before continuing.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      await finishSignIn();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: factorData, error: listErr } = await supabase.auth.mfa.listFactors();
      const totp = factorData?.totp?.find((f) => f.status === 'verified');
      if (listErr || !totp) {
        setError('Could not load your 2FA settings. Please try signing in again.');
        setLoading(false);
        return;
      }
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      });
      if (challengeErr) {
        setError(challengeErr.message);
        setLoading(false);
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });
      if (verifyErr) {
        setError('That code didn’t match. Check your authenticator app and try again.');
        setLoading(false);
        return;
      }
      await finishSignIn();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (mfaRequired) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Two-factor authentication is on for this account.
        </div>
        <div>
          <label htmlFor="mfa-code" className="block text-sm font-medium mb-1.5">
            6-digit code from your authenticator app
          </label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className="tracking-widest"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading || mfaCode.trim().length !== 6}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify &amp; Sign In
        </Button>
      </form>
    );
  }

  return (
    <div>
      <GoogleButton next={next} />
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign In
      </Button>
      </form>
    </div>
  );
}
