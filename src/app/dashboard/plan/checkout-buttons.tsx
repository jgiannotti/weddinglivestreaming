'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function CheckoutButtons() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(processor: 'stripe' | 'paypal') {
    setLoading(processor);
    try {
      const res = await fetch(`/api/checkout/${processor}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
        <button
          type="button"
          onClick={() => setPlan('monthly')}
          className={`py-2 rounded-md text-sm font-medium transition-colors ${
            plan === 'monthly' ? 'bg-card shadow' : 'text-muted-foreground'
          }`}
        >
          Monthly · $29
        </button>
        <button
          type="button"
          onClick={() => setPlan('annual')}
          className={`py-2 rounded-md text-sm font-medium transition-colors ${
            plan === 'annual' ? 'bg-card shadow' : 'text-muted-foreground'
          }`}
        >
          Annual · $199
        </button>
      </div>
      <Button onClick={() => checkout('stripe')} disabled={!!loading} className="w-full" size="lg">
        {loading === 'stripe' && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay with Card (Stripe)
      </Button>
      <Button onClick={() => checkout('paypal')} disabled={!!loading} variant="outline" className="w-full" size="lg">
        {loading === 'paypal' && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay with PayPal
      </Button>
    </div>
  );
}
