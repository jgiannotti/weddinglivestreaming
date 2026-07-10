'use client';

// Two-factor authentication (TOTP) enrollment + management.
// Uses Supabase MFA: enroll -> scan QR -> verify first code -> factor active.
// Sign-in then requires a 6-digit code (see sign-in-form.tsx).

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';

interface Factor {
  id: string;
  friendly_name?: string | null;
  status: 'verified' | 'unverified';
  created_at: string;
}

export function TwoFactorManager() {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) {
      setError(listErr.message);
    } else {
      setFactors((data?.totp as Factor[]) || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function startEnrollment() {
    setError(null);
    setBusy(true);
    // Clean up any abandoned unverified factors first — Supabase keeps them.
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of (data?.totp as Factor[]) || []) {
      if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator (${new Date().toLocaleDateString()})`,
    });
    setBusy(false);
    if (enrollErr) {
      setError(enrollErr.message);
      return;
    }
    setFactorId(enrollData.id);
    setQrCode(enrollData.totp.qr_code);
    setSecret(enrollData.totp.secret);
    setEnrolling(true);
  }

  async function confirmEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) {
      setBusy(false);
      setError(challengeErr.message);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (verifyErr) {
      setError('That code didn’t match. Check your authenticator app and try again.');
      return;
    }
    setEnrolling(false);
    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setCode('');
    await refresh();
  }

  async function removeFactor(id: string) {
    setError(null);
    setBusy(true);
    const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: id });
    setBusy(false);
    if (unenrollErr) {
      setError(unenrollErr.message);
      return;
    }
    await refresh();
  }

  const verified = factors.filter((f) => f.status === 'verified');

  if (loading) {
    return (
      <Card className="p-6 md:p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your security settings…
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          {verified.length > 0 ? (
            <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
          ) : (
            <ShieldOff className="h-8 w-8 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1">
            <h2 className="font-semibold mb-1">
              Two-factor authentication is {verified.length > 0 ? 'on' : 'off'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {verified.length > 0
                ? 'Signing in requires your password plus a 6-digit code from your authenticator app.'
                : 'Anyone with your password can access your account. Add an authenticator app (Google Authenticator, 1Password, Authy…) for a second check at sign-in.'}
            </p>

            {verified.length > 0 && (
              <ul className="mb-4 space-y-2">
                {verified.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>
                      {f.friendly_name || 'Authenticator app'}{' '}
                      <span className="text-muted-foreground">
                        · added {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => removeFactor(f.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {!enrolling && (
              <Button onClick={startEnrollment} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {verified.length > 0 ? 'Add another authenticator' : 'Turn on 2FA'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {enrolling && qrCode && (
        <Card className="p-6 md:p-8">
          <h3 className="font-semibold mb-2">Scan this QR code</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Open your authenticator app and scan the code, then enter the 6-digit code it shows to
            finish setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Supabase returns the QR as an inline SVG data URI */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR code" className="w-40 h-40 rounded-lg border bg-white p-2" />
            <div className="flex-1 w-full">
              {secret && (
                <p className="text-xs text-muted-foreground mb-4 break-all">
                  Can&rsquo;t scan? Enter this key manually: <code className="font-mono">{secret}</code>
                </p>
              )}
              <form onSubmit={confirmEnrollment} className="space-y-3">
                <div>
                  <label htmlFor="totp-code" className="block text-sm font-medium mb-1.5">
                    6-digit code
                  </label>
                  <Input
                    id="totp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="max-w-[160px] tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy || code.trim().length !== 6}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify &amp; activate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                      if (factorId) await supabase.auth.mfa.unenroll({ factorId });
                      setEnrolling(false);
                      setFactorId(null);
                      setQrCode(null);
                      setSecret(null);
                      setCode('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
