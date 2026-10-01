import Link from 'next/link';
import { Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { CheckoutButtons } from './checkout-buttons';
import { ensureProfile } from '@/lib/auth';
import { FOUNDING_MONTHS, type FoundingView } from '@/lib/founding-shared';
import { getFoundingView } from '@/lib/founding';
import { getMyVendor } from '@/lib/data/my-vendor';
import { formatFoundingDate } from '@/lib/founding-shared';
import { FoundingButton } from '../founding-button';

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function PlanPage({ searchParams }: PageProps) {
  const { success } = await searchParams;
  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return null;

  const vendor = await getMyVendor(supabase, user.id);

  interface SubscriptionRow {
    id: string;
    processor: string;
    plan: string;
    status: string;
    current_period_end: string | null;
  }
  const { data: subscriptionRows } = vendor
    ? await supabase
        .from('subscriptions')
        .select('id, processor, plan, status, current_period_end')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
    : { data: null };
  const subscriptions = (subscriptionRows as SubscriptionRow[] | null) ?? [];

  const { data: listingRows } = vendor
    ? await supabase
        .from('listings')
        .select('id, status, tier, featured_until')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: true })
    : { data: null };
  const listings =
    (listingRows as { id: string; status: string; tier: string; featured_until: string | null }[] | null) ?? [];
  const firstListing = listings[0];
  // Featured is placement for a listing the public can see.
  const hasLiveListing = listings.some((l) => l.status === 'approved');

  // The subscription that is live, if any: paid up, or past due while Stripe
  // retries a failed payment (it still exists, so a second checkout here would
  // start a second one). An old cancelled row is history, not a plan.
  const subscription =
    subscriptions.find((s) => s.status === 'active') ?? subscriptions.find((s) => s.status === 'past_due') ?? null;
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  // The founding offer: Featured free for six months for an owned listing
  // with a price and a photo. A vendor on it has nothing to buy yet, and
  // subscribing during the free period would start billing that day and throw
  // the rest of it away, so checkout stays closed until the period ends.
  const founding: FoundingView = vendor ? await getFoundingView(vendor.id) : { state: 'none' };

  // The rules below are the ones the checkout route enforces
  // (src/app/api/checkout/stripe/route.ts). Keep the two the same.
  //
  // Featured with an end date still ahead and no live subscription: a free
  // period. Checkout stays closed until it is over.
  const freeUntil =
    !subscription &&
    listings
      .filter((l) => l.tier === 'featured' && l.featured_until && new Date(l.featured_until).getTime() > Date.now())
      .map((l) => l.featured_until as string)
      .sort()
      .pop();
  // Featured with no end date: set by hand, at no charge. Paying would change
  // nothing, so there is nothing to sell.
  const comped = !subscription && listings.some((l) => l.tier === 'featured' && !l.featured_until);
  // Back from Stripe, before its confirmation has reached us. Without this the
  // page showed the pay button again for those few seconds. The flag carries
  // the time of the payment and counts for an hour, so a tab left open (or a
  // bookmark) cannot go on saying "payment received" months later.
  const paidAt = Number(success);
  const justPaid =
    !subscription && Number.isFinite(paidAt) && paidAt > 0 && Math.abs(Date.now() / 1000 - paidAt) < 3600;
  const canSubscribe = Boolean(vendor) && hasLiveListing && !subscription && !freeUntil && !comped && !justPaid;

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Your Plan</h1>
      <p className="text-muted-foreground mb-8">Upgrade or manage your Featured subscription.</p>

      {justPaid && (
        <div className="mb-8 p-5 rounded-xl border border-primary/30 bg-primary/10">
          <p className="text-sm">
            <strong>Payment received. Thank you.</strong> Your Featured plan is being switched on, which
            usually takes less than a minute. Refresh this page to see it.
          </p>
        </div>
      )}

      {isActive && subscription && (
        <div className="mb-8 p-5 rounded-xl bg-gold/10 border border-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-semibold">Featured ({subscription.plan})</span>
            <Badge variant="gold">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription.current_period_end
              ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()} via ${subscription.processor === 'stripe' ? 'Stripe' : 'PayPal'}.`
              : `Billed via ${subscription.processor === 'stripe' ? 'Stripe' : 'PayPal'}.`}
          </p>
        </div>
      )}

      {founding.state === 'active' && (
        <div className="mb-8 p-5 rounded-xl bg-gold/10 border border-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-semibold">Founding vendor</span>
            <Badge variant="gold">Featured, free</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your listing is Featured at no charge until {formatFoundingDate(founding.until)}. There is
            nothing to pay now and no card on file. After that date it returns to a free Basic
            listing and nothing is charged. If you want to keep Featured, come back to this page
            once the free period has ended and subscribe then.
          </p>
        </div>
      )}
      {founding.state === 'ended' && !isActive && !isPastDue && (
        <div className="mb-8 p-5 rounded-xl border bg-card">
          <p className="text-sm">
            <strong>
              Your free Featured period{' '}
              {founding.endedOn ? `ended on ${formatFoundingDate(founding.endedOn)}` : 'has ended'}.
            </strong>{' '}
            Your listing is now a free Basic listing and nothing was charged. To get Featured back,
            subscribe below.
          </p>
        </div>
      )}
      {isPastDue && (
        <div className="mb-8 p-5 rounded-xl border bg-card">
          <p className="text-sm">
            <strong>Your last payment did not go through.</strong> Stripe will try the card again
            over the next few days. To update your card or cancel, email{' '}
            <a href="mailto:hello@weddinglivestreaming.com" className="text-primary font-medium hover:underline">
              hello@weddinglivestreaming.com
            </a>
            .
          </p>
        </div>
      )}
      {(founding.state === 'incomplete' || founding.state === 'ready') && (
        <div className="mb-8 p-5 rounded-xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <span className="font-semibold">Founding vendor offer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {founding.state === 'ready'
                ? `Your listing has a price and a photo, so it qualifies for Featured free for ${FOUNDING_MONTHS} months. No card needed.`
                : `Add ${
                    founding.missing.length === 2
                      ? 'your starting price and a cover photo'
                      : founding.missing[0] === 'price'
                        ? 'your starting price'
                        : 'a cover photo'
                  } to your listing and it is Featured free for ${FOUNDING_MONTHS} months. No card needed.`}
            </p>
          </div>
          {founding.state === 'ready' ? (
            <FoundingButton />
          ) : firstListing ? (
            <Link
              href={`/dashboard/listings/${firstListing.id}/edit`}
              className="shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 text-center hover:opacity-90 transition-opacity"
            >
              Finish my listing
            </Link>
          ) : null}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display text-xl font-semibold mb-1">Basic</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {subscription || freeUntil || comped ? 'Free, no expiration' : 'Free. Your current plan.'}
          </p>
          <ul className="space-y-2 text-sm mb-6">
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Full vendor profile</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Location-based search</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Couple quote requests and direct messages</li>
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
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Priority in couple quote matches</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Top placement in search</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Gold &ldquo;Featured&rdquo; badge</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> A turn in the homepage spotlight</li>
          </ul>
          {canSubscribe && <CheckoutButtons />}
          {freeUntil && (
            <p className="text-sm text-muted-foreground">
              You have this free until {formatFoundingDate(freeUntil)}. Subscribing opens when your
              free period ends.
            </p>
          )}
          {comped && (
            <p className="text-sm text-muted-foreground">
              Your listing is Featured at no charge. There is nothing to pay.
            </p>
          )}
          {vendor && listings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Finish your listing first. Featured applies to a listing, so there is nothing to upgrade yet.
            </p>
          )}
          {vendor && listings.length > 0 && !hasLiveListing && (
            <p className="text-sm text-muted-foreground">
              {listings.some((l) => l.status === 'pending')
                ? 'Your listing is not live yet. You can upgrade it as soon as it has been approved.'
                : 'Your listing is not live, so there is nothing to upgrade.'}
            </p>
          )}
          {isActive && (
            <p className="text-sm text-muted-foreground">
              To change or cancel your subscription, email{' '}
              <a href="mailto:hello@weddinglivestreaming.com" className="text-primary font-medium hover:underline">
                hello@weddinglivestreaming.com
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
