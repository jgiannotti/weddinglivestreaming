'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  listingId: string;
  businessName: string;
}

export function ClaimForm({ listingId, businessName }: Props) {
  const router = useRouter();
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          business_email: businessEmail,
          business_phone: businessPhone || undefined,
          proof,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border bg-card p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
        <p className="font-display text-xl mb-1">Claim submitted</p>
        <p className="text-sm text-muted-foreground">
          We verify every claim by hand — usually within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-6 md:p-8 space-y-4">
      <h2 className="font-display text-xl font-semibold">Verify you own {businessName}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="claim-email" className="block text-sm font-medium mb-1.5">
            Business email *
          </label>
          <Input
            id="claim-email"
            type="email"
            required
            placeholder="you@yourbusiness.com"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Ideally at the same domain as your website.
          </p>
        </div>
        <div>
          <label htmlFor="claim-phone" className="block text-sm font-medium mb-1.5">
            Business phone
          </label>
          <Input
            id="claim-phone"
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="claim-proof" className="block text-sm font-medium mb-1.5">
          How can we verify you? *
        </label>
        <textarea
          id="claim-proof"
          rows={4}
          required
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="E.g. my email matches the domain on the listing, I can reply from the business Instagram, my name is on the website's About page…"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading || !businessEmail || !proof}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Claim
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Claims are reviewed by a human. Fraudulent claims are removed and blocked.
      </p>
    </form>
  );
}
