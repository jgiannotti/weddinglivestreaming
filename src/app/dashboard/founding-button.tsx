'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// "Turn on Featured" for a vendor whose listing already qualifies for the
// founding offer but has not had it applied (for example, the listing was
// completed before the offer existed). The server decides eligibility; this
// only asks it to check.
export function FoundingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/founding', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.state !== 'active') {
        throw new Error('Could not turn it on just now. Please try again in a minute.');
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0 text-center">
      <Button size="sm" onClick={activate} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Turn on Featured
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
