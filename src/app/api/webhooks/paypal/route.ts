import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// PayPal subscription webhook. Configure at developer.paypal.com →
//   Webhooks → URL: https://weddinglivestreaming.com/api/webhooks/paypal
//   Events: BILLING.SUBSCRIPTION.ACTIVATED, .CANCELLED, .EXPIRED, .PAYMENT.FAILED
// PayPal sends signed JSON. Verification omitted here for brevity — in production
// validate via PayPal's verify-webhook-signature endpoint.

export async function POST(_request: Request) {
  // PayPal has been discontinued (Stripe-only now). This route never verified
  // PayPal's webhook signature and was exploitable (forged BILLING.SUBSCRIPTION.ACTIVATED
  // events could upgrade any vendor to Featured for free). Disabled entirely — do not
  // re-enable without implementing proper PayPal signature verification.
  return NextResponse.json(
    { error: 'PayPal checkout has been discontinued. Please use Stripe.' },
    { status: 410 }
  );

  /* eslint-disable no-unreachable */
  const event = await _request.json();
  const supabase = await createAdminClient();

  const resource = event.resource || {};
  const subscriptionId = resource.id;
  const customId = resource.custom_id as string | undefined;

  switch (event.event_type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const [vendorId, plan] = (customId || '').split(':');
      if (vendorId && subscriptionId) {
        await supabase.from('subscriptions').insert({
          vendor_id: vendorId,
          processor: 'paypal',
          external_id: subscriptionId,
          plan: (plan as 'monthly' | 'annual') || 'monthly',
          status: 'active',
        });
        await supabase
          .from('listings')
          .update({
            tier: 'featured',
            featured_until: new Date(Date.now() + (plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('vendor_id', vendorId);
      }
      break;
    }
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED': {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('vendor_id')
        .eq('external_id', subscriptionId)
        .single();
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('external_id', subscriptionId);
      if (sub?.vendor_id) {
        await supabase
          .from('listings')
          .update({ tier: 'basic', featured_until: null })
          .eq('vendor_id', sub.vendor_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
