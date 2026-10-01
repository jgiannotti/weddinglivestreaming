import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { ensureProfile } from '@/lib/auth';
import { getMyVendor } from '@/lib/data/my-vendor';
import { formatFoundingDate } from '@/lib/founding-shared';

// A Checkout page stays payable for 24 hours unless told otherwise. That is
// long enough for what this route checked to stop being true: the vendor
// claims a profile or earns the free founding period in another tab, then
// comes back and pays for it. Stripe's minimum is 30 minutes.
const CHECKOUT_EXPIRES_SECONDS = 35 * 60;

export async function POST(request: Request) {
  let plan: unknown;
  try {
    ({ plan } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (plan !== 'monthly' && plan !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // Everything this route decides on is read with the service role, scoped to
  // the signed-in account. Not with the visitor's own client, on purpose: if
  // its token ever reaches the database without its role (it has happened),
  // row-level security answers "no rows" rather than an error, and "no
  // subscription" is exactly the answer that would let a second one through.
  const admin = await createAdminClient();

  const vendor = await getMyVendor(admin, user.id);
  if (!vendor) return NextResponse.json({ error: 'Create a listing first' }, { status: 400 });

  // If either read fails, nothing is charged.
  const [subsRes, listingsRes] = await Promise.all([
    admin.from('subscriptions').select('status').eq('vendor_id', vendor.id),
    admin.from('listings').select('status, tier, featured_until').eq('vendor_id', vendor.id),
  ]);
  if (subsRes.error || listingsRes.error) {
    console.error('[checkout] could not read the current plan', {
      subscriptions: subsRes.error?.message,
      listings: listingsRes.error?.message,
    });
    return NextResponse.json(
      { error: 'We could not check your current plan just now, so nothing was charged. Please try again in a minute.' },
      { status: 503 }
    );
  }
  const subs = (subsRes.data as { status: string }[] | null) ?? [];
  const listings =
    (listingsRes.data as { status: string; tier: string; featured_until: string | null }[] | null) ?? [];

  // Four things must never reach Stripe. (The plan page hides the buttons by
  // the same rules: src/app/dashboard/plan/page.tsx. Keep them the same.)

  // 1. A vendor with no live listing. Featured is placement for a listing the
  //    public can see. An account whose sign-up stopped halfway, or whose
  //    listing is still waiting for review or was not approved, would be
  //    paying for nothing.
  if (listings.length === 0) {
    return NextResponse.json(
      { error: 'Finish your listing first. Featured applies to a listing, so there is nothing to upgrade yet.' },
      { status: 400 }
    );
  }
  if (!listings.some((l) => l.status === 'approved')) {
    return NextResponse.json(
      {
        error: listings.some((l) => l.status === 'pending')
          ? 'Your listing is not live yet. You can upgrade it as soon as it has been approved.'
          : 'Your listing is not live, so there is nothing to upgrade. Email hello@weddinglivestreaming.com if you think that is a mistake.',
      },
      { status: 400 }
    );
  }

  // 2. A vendor who already has a subscription (active, or past due while
  //    Stripe retries the card). A second checkout would start a second one.
  if (subs.some((s) => s.status === 'active' || s.status === 'past_due')) {
    return NextResponse.json(
      {
        error:
          'You already have a Featured subscription. To change or cancel it, email hello@weddinglivestreaming.com.',
      },
      { status: 409 }
    );
  }

  // 3. A vendor inside a free Featured period (the founding offer): Featured
  //    with an end date still ahead. Checkout has no deferred start, so
  //    subscribing would charge them today for months that are already free,
  //    and a later cancellation would end Featured before the date they were
  //    promised.
  const freeUntil = listings
    .filter((l) => l.tier === 'featured' && l.featured_until && new Date(l.featured_until).getTime() > Date.now())
    .map((l) => l.featured_until as string)
    .sort()
    .pop();
  if (freeUntil) {
    return NextResponse.json(
      {
        error: `Your listing is already Featured free until ${formatFoundingDate(freeUntil)}. You can subscribe once that free period has ended.`,
      },
      { status: 409 }
    );
  }

  // 4. A listing Featured with no end date (set by hand, at no charge).
  //    Paying would change nothing.
  if (listings.some((l) => l.tier === 'featured' && !l.featured_until)) {
    return NextResponse.json(
      { error: 'Your listing is already Featured at no charge. There is nothing to pay.' },
      { status: 409 }
    );
  }

  const priceId = plan === 'monthly'
    ? process.env.STRIPE_PRICE_FEATURED_MONTHLY
    : process.env.STRIPE_PRICE_FEATURED_ANNUAL;

  if (!priceId) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_SECONDS,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      // The time, not just a flag: the plan page shows "payment received" for
      // an hour after it, so an old tab or bookmark does not say it forever.
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/plan?success=${Math.floor(Date.now() / 1000)}`,
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
    console.error('[checkout] stripe session failed', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again in a minute.' }, { status: 500 });
  }
}
