import { Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { CheckoutButtons } from './checkout-buttons';

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: subscription } = vendor
    ? await supabase
        .from('subscriptions')
        .select('id, processor, plan, status, current_period_end')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const isActive = subscription?.status === 'active';

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Your Plan</h1>
      <p className="text-muted-foreground mb-8">Upgrade or manage your Featured subscription.</p>

      {isActive && subscription && (
        <div className="mb-8 p-5 rounded-xl bg-gold/10 border border-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-semibold">Featured ({subscription.plan})</span>
            <Badge variant="gold">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Renews on {new Date(subscription.current_period_end!).toLocaleDateString()} via {subscription.processor === 'stripe' ? 'Stripe' : 'PayPal'}.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display text-xl font-semibold mb-1">Basic</h3>
          <p className="text-sm text-muted-foreground mb-4">Free — your current plan</p>
          <ul className="space-y-2 text-sm mb-6">
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Full vendor profile</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Location-based search</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Direct messages</li>
          </ul>
        </div>

        <div className="rounded-xl border-2 border-primary bg-card p-6 relative">
          <div className="absolute -top-3 left-6">
            <Badge variant="gold">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
          <div className="mb-4">
            <span className="font-display text-3xl font-medium">$29</span>
            <span className="text-muted-foreground">/mo</span>
            <span className="text-sm text-muted-foreground block">or $199/year (save 43%)</span>
          </div>
          <ul className="space-y-2 text-sm mb-6">
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Everything in Basic</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Top placement in search</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Gold &ldquo;Featured&rdquo; badge</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Homepage spotlight</li>
          </ul>
          {!isActive && <CheckoutButtons />}
        </div>
      </div>
    </div>
  );
}
