'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

export function ClaimButtons({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: 'approve' | 'reject') {
    setLoading(action);
    setError(null);
    const res = await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed');
    }
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="shrink-0">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => decide('reject')} disabled={!!loading}>
          {loading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Reject
        </Button>
        <Button size="sm" onClick={() => decide('approve')} disabled={!!loading}>
          {loading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
