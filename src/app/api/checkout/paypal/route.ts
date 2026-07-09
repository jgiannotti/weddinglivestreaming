import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PayPal subscription creation. Uses REST API directly (no SDK needed).
// Docs: https://developer.paypal.com/docs/api/subscriptions/v1/

async function paypalToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${auth}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('PayPal auth failed');
  return data.access_token;
}

export async function POST(request: Request) {
  // PayPal has been discontinued (Stripe-only now). Disabled entirely.
  return NextResponse.json(
    { error: 'PayPal checkout has been discontinued. Please use Stripe.' },
    { status: 410 }
  );

  /* eslint-disable no-unreachable */
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

  const planId = plan === 'monthly'
    ? process.env.PAYPAL_PLAN_FEATURED_MONTHLY
    : process.env.PAYPAL_PLAN_FEATURED_ANNUAL;
  if (!planId) return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 });

  try {
    const token = await paypalToken();
    const res = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: { email_address: user.email },
        application_context: {
          brand_name: 'WeddingLiveStreaming',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/plan?paypal_success=1`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/plan`,
        },
        custom_id: `${vendor.id}:${plan}`,
      }),
    });
    const data = await res.json();
    const approvalUrl = data.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!approvalUrl) return NextResponse.json({ error: data.message || 'PayPal error' }, { status: 500 });
    return NextResponse.json({ url: approvalUrl });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
