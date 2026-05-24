import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const { plan } = await request.json();
  if (!['monthly', 'annual'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!vendor) return NextResponse.json({ error: 'Create a listing first' }, { status: 400 });

  const priceId = plan === 'monthly'
    ? process.env.STRIPE_PRICE_FEATURED_MONTHLY
    : process.env.STRIPE_PRICE_FEATURED_ANNUAL;

  if (!priceId) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/plan?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/plan`,
      metadata: {
        vendor_id: vendor.id,
        plan,
      },
      subscription_data: {
        metadata: { vendor_id: vendor.id, plan },
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
