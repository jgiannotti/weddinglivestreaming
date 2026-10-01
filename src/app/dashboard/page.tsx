import Link from 'next/link';
import { Plus, Eye, Sparkles, Heart, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { getListingTraffic, statsWindow, STATS_WINDOW_DAYS, type ListingTraffic } from '@/lib/data/vendor-stats';
import { FOUNDING_MONTHS, type FoundingListingRow, type FoundingView } from '@/lib/founding-shared';
import { getFoundingView } from '@/lib/founding';
import { getMyVendor } from '@/lib/data/my-vendor';
import { formatFoundingDate } from '@/lib/founding-shared';
import { FoundingButton } from './founding-button';

interface PageProps {
  searchParams: Promise<{ welcome?: string; claimed?: string; photo?: string }>;
}

interface ListingRow extends FoundingListingRow {
  title: string;
  slug: string;
}

function effectivelyFeatured(l: ListingRow): boolean {
  return l.tier === 'featured' && (!l.featured_until || new Date(l.featured_until) > new Date());
}

export default async function DashboardOverview({ searchParams }: PageProps) {
  const { welcome, claimed, photo } = await searchParams;
  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return null;

  // Find vendor record for current user
  const vendor = await getMyVendor(supabase, user.id);

  let listings: ListingRow[] = [];
  let unreadMessages = 0;
  let quoteRequests = 0;
  let founding: FoundingView = { state: 'none' };
  const traffic = new Map<string, ListingTraffic | null>();

  if (vendor) {
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, title, slug, tier, status, featured_until, starting_price_cents, hero_image_url')
      .eq('vendor_id', vendor.id);
    listings = (listingData as ListingRow[] | null) || [];

    const [unreadRes, leadsRes, foundingRes, ...trafficRes] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_vendor_id', vendor.id)
        .is('read_at', null),
      // Couples' quote requests matched to this vendor. RLS limits the rows to
      // leads whose matched_vendor_ids contains one of the caller's vendors.
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .contains('matched_vendor_ids', [vendor.id]),
      // Where this vendor stands with the founding offer. Fails closed: any
      // error reads as "no offer", never as "offer available".
      getFoundingView(vendor.id),
      // Real page views from the first-party log. The view_count column this
      // page used to show was never written by anything, so it read 0 forever.
      ...listings.map((l) => getListingTraffic(l.slug)),
    ]);
    unreadMessages = unreadRes.count || 0;
    quoteRequests = leadsRes.count || 0;
    founding = foundingRes as FoundingView;
    listings.forEach((l, i) => traffic.set(l.id, (trafficRes[i] as ListingTraffic | null) ?? null));
  }

  const trafficKnown = listings.some((l) => traffic.get(l.id) != null);
  const totalViews = listings.reduce((s, l) => s + (traffic.get(l.id)?.views ?? 0), 0);
  const totalAiVisits = listings.reduce((s, l) => s + (traffic.get(l.id)?.aiVisits ?? 0), 0);
  const firstListing = listings[0];
  // "in the last 30 days", or "since <date>" while the corrected counter has
  // been running for less than 30 days. On the release day itself counting
  // starts tomorrow, and the wording says so.
  const range = statsWindow();
  const windowLabel = range.notStarted
    ? `from ${formatFoundingDate(range.since)} on`
    : range.partialWindow
      ? `since ${formatFoundingDate(range.since)}`
      : `in the last ${STATS_WINDOW_DAYS} days`;

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your listing and your quote requests.</p>

      {claimed && vendor && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 mb-6 text-sm">
          <strong>{vendor.business_name} is yours.</strong> You can edit the listing and add a cover
          photo, and couples&rsquo; quote requests now come straight to you.
        </div>
      )}
      {welcome && vendor && listings.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 mb-6 text-sm">
          <strong>Listing submitted.</strong> We review every new listing by hand, usually within 24
          hours, and email you the moment it is live.
          {photo === 'failed' && (
            <> Your photo did not upload, so please add it with the Edit button below.</>
          )}
        </div>
      )}

      {!vendor && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-4">You don&rsquo;t have a listing yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/claim">Find &amp; Claim Your Listing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/submit-listing">
                <Plus className="h-4 w-4" />
                Add a New Listing
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* A vendor record with no listing means an earlier submission stopped
          partway. This used to be a dead end (no listings, no way to add one). */}
      {vendor && listings.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center">
          <p className="font-semibold mb-1">Your listing isn&rsquo;t finished yet</p>
          <p className="text-muted-foreground mb-4 text-sm">
            Your account is set up, but no listing was saved. It takes about five minutes.
          </p>
          <Button asChild>
            <Link href="/submit-listing">
              <Plus className="h-4 w-4" />
              Finish Your Listing
            </Link>
          </Button>
        </div>
      )}

      {vendor && listings.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Profile views
              </p>
              <p className="font-display text-3xl font-semibold">{trafficKnown ? totalViews : '–'}</p>
            </div>
            <Link href="/dashboard/leads" className="rounded-xl border bg-card p-5 hover:border-primary/50 transition-colors">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Quote requests
              </p>
              <p className="font-display text-3xl font-semibold">{quoteRequests}</p>
            </Link>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" /> AI assistant visits
              </p>
              <p className="font-display text-3xl font-semibold">{trafficKnown ? totalAiVisits : '–'}</p>
            </div>
            <Link href="/dashboard/messages" className="rounded-xl border bg-card p-5 hover:border-primary/50 transition-colors">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Unread messages
              </p>
              <p className="font-display text-3xl font-semibold">{unreadMessages}</p>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-8 prose-measure">
            Profile views are the times your listing was opened in a browser in the United States{' '}
            {windowLabel}, with known bots left out. Your own visits are included. AI assistant
            visits are the times ChatGPT, Claude or Perplexity fetched your listing in the same
            period, to index it for search or while answering someone. Quote requests are all
            couples matched to you so far.
          </p>

          {founding.state === 'active' && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-5 mb-8 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>You&rsquo;re a founding vendor.</strong> Your listing is Featured free until{' '}
                {formatFoundingDate(founding.until)}: top placement in search, the gold Featured badge,
                a turn in the homepage spotlight, and priority when couples request quotes in your
                area. Nothing to pay and no card on
                file. After that date it returns to a free Basic listing, and nothing is charged
                unless you choose to subscribe then.
              </p>
            </div>
          )}
          {founding.state === 'ended' && (
            <div className="rounded-xl border bg-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm flex-1">
                <strong>
                  Your free Featured period{' '}
                  {founding.endedOn ? `ended on ${formatFoundingDate(founding.endedOn)}` : 'has ended'}.
                </strong>{' '}
                Your listing is now a free Basic listing and nothing was charged. To get Featured
                back, subscribe for $29 a month or $199 a year.
              </p>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/dashboard/plan">See the Featured plan</Link>
              </Button>
            </div>
          )}
          {founding.state === 'incomplete' && firstListing && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Founding vendor offer:</strong> add{' '}
                  {founding.missing.length === 2
                    ? 'your starting price and a cover photo'
                    : founding.missing[0] === 'price'
                      ? 'your starting price'
                      : 'a cover photo'}{' '}
                  and your listing is Featured free for {FOUNDING_MONTHS} months. No card needed.
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href={`/dashboard/listings/${firstListing.id}/edit`}>Finish my listing</Link>
              </Button>
            </div>
          )}
          {founding.state === 'ready' && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Founding vendor offer:</strong> your listing has a price and a photo, so it
                  qualifies for Featured free for {FOUNDING_MONTHS} months. No card needed.
                </p>
              </div>
              <FoundingButton />
            </div>
          )}
          {founding.state === 'pending' && (
            <div className="rounded-xl border bg-card p-5 mb-8 text-sm text-muted-foreground">
              Your listing is waiting for review. Once it is approved, a starting price and a cover
              photo make it Featured free for {FOUNDING_MONTHS} months.
            </div>
          )}
          {founding.state === 'rejected' && (
            <div className="rounded-xl border bg-card p-5 mb-8 text-sm text-muted-foreground">
              This listing was not approved, so it is not public. If you think that is a mistake, or
              you want to know what to change, email{' '}
              <a href="mailto:hello@weddinglivestreaming.com" className="text-primary font-medium hover:underline">
                hello@weddinglivestreaming.com
              </a>
              .
            </div>
          )}

          <h2 className="font-display text-2xl font-semibold mb-4">Your Listings</h2>
          <div className="space-y-3 mb-8">
            {listings.map((listing) => {
              const t = traffic.get(listing.id);
              return (
                <div key={listing.id} className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{listing.title}</h3>
                      {effectivelyFeatured(listing) && (
                        <Badge variant="gold" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {listing.status === 'pending' && (
                        <Badge variant="secondary">Pending review</Badge>
                      )}
                      {listing.status === 'rejected' && (
                        <Badge variant="secondary">Not approved</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />{' '}
                        {range.notStarted
                          ? `View counting starts ${formatFoundingDate(range.since)}`
                          : t
                            ? `${t.views} ${t.views === 1 ? 'view' : 'views'} ${windowLabel}`
                            : 'Views unavailable'}
                      </span>
                      {listing.starting_price_cents == null && <span>No starting price yet</span>}
                      {!listing.hero_image_url && <span>No cover photo yet</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {listing.status === 'approved' && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/listing/${listing.slug}`}>View</Link>
                      </Button>
                    )}
                    <Button asChild size="sm">
                      <Link href={`/dashboard/listings/${listing.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-accent/30 border p-6 text-center mb-8">
            <h3 className="font-display text-xl font-semibold mb-2">Show couples you&rsquo;re listed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add the free &ldquo;Featured on WeddingLiveStreaming.com&rdquo; badge to your website. It
              links couples straight to your profile.
            </p>
            <Button asChild variant="outline">
              <Link href="/vendor-badge">Get Your Badge</Link>
            </Button>
          </div>

          {founding.state === 'none' && !listings.some(effectivelyFeatured) && (
            <div className="rounded-xl bg-accent/30 border p-6 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-display text-xl font-semibold mb-2">Want more visibility?</h3>
              <p className="text-sm text-muted-foreground mb-4">Upgrade to Featured for top placement in search results and the homepage spotlight.</p>
              <Button asChild>
                <Link href="/dashboard/plan">View Plans</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
