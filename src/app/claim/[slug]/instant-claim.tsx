'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClaimForm } from './claim-form';

interface Props {
  listingId: string;
  businessName: string;
  token: string;
}

// One-tap claim for a vendor who arrived through a signed claim link (the one
// in our lead email, or one the owner sent). A button rather than an automatic
// claim on page load:
// mail scanners and link previews open URLs too, and ownership should only
// change when a signed-in person says so.
export function InstantClaim({ listingId, businessName, token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  async function handleClaim() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/claims/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fallback) setFallback(true);
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      // Straight to the thing they came for: the couple who is waiting.
      router.push(data.waitingLeads > 0 ? '/dashboard/leads?claimed=1' : '/dashboard?claimed=1');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (fallback) {
    return (
      <>
        {error && (
          <p className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground mb-4">{error}</p>
        )}
        <ClaimForm listingId={listingId} businessName={businessName} />
      </>
    );
  }

  return (
    <div className="rounded-3xl bg-accent/30 border border-accent p-8 text-center">
      <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-3" />
      <h2 className="font-display text-2xl mb-2">You&rsquo;re verified. Claim it now.</h2>
      <p className="text-muted-foreground text-sm mb-6 prose-measure mx-auto">
        You opened the personal claim link we sent for {businessName}, which is all the proof we
        need. Confirm below and the profile is yours right away.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 mb-4">
          {error}
        </div>
      )}

      <Button onClick={handleClaim} size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Yes, this is my business. Claim it
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Only claim a business you own or are authorized to represent. Fraudulent claims are removed
        and blocked.
      </p>
    </div>
  );
}
