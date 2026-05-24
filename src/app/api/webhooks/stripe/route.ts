import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature: ${(err as Error).message}` }, { status: 400 });
  }

  const supabase = await createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const vendorId = session.metadata?.vendor_id;
      const plan = session.metadata?.plan as 'monthly' | 'annual';
      if (vendorId && session.subscription) {
        await supabase.from('subscriptions').insert({
          vendor_id: vendorId,
          processor: 'stripe',
          external_customer_id: session.customer as string,
          external_id: session.subscription as string,
          plan,
          status: 'active',
        });
        // Upgrade all vendor's listings to featured
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
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status as 'active' | 'past_due' | 'canceled' | 'incomplete',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('external_id', sub.id);
      if (sub.status === 'canceled') {
        // Downgrade listings back to basic
        const vendorId = sub.metadata?.vendor_id;
        if (vendorId) {
          await supabase
            .from('listings')
            .update({ tier: 'basic', featured_until: null })
            .eq('vendor_id', vendorId);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
