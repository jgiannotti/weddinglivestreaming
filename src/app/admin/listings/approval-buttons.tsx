'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

export function ApprovalButtons({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(action: 'approve' | 'reject') {
    setLoading(action);
    await fetch(`/api/admin/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    router.refresh();
    setLoading(null);
  }

  return (
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
  );
}
