'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(action: 'resolve' | 'dismiss') {
    setLoading(action);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => decide('dismiss')} disabled={!!loading}>
        {loading === 'dismiss' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        Dismiss
      </Button>
      <Button size="sm" onClick={() => decide('resolve')} disabled={!!loading}>
        {loading === 'resolve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Resolve
      </Button>
    </div>
  );
}
