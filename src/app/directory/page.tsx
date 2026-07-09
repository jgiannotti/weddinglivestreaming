import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { ListingCard } from '@/components/listing-card';
import { LeadForm } from '@/components/lead-form';
import { Button } from '@/components/ui/button';
import { getListings, getListingsByLocation } from '@/lib/data/listings';
import { CATEGORIES } from '@/lib/categories';
import { BreadcrumbJsonLd, ListingsItemListJsonLd } from '@/components/json-ld';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Find Vendors',
  description: 'Browse professional wedding live streaming vendors across the United States.',
  // Every filter/sort/page combination is the same underlying content — point
  // them all at the unfiltered canonical URL so search engines don't treat
  // ?location=&category=&page= combinations as separate duplicate pages.
  alternates: { canonical: '/directory' },
};

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    location?: string;
    category?: string;
    sort?: 'date' | 'title';
    page?: string;
  }>;
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Milestone 2: a typed location goes through tiered radius search (own-DB
  // city/ZIP resolution -> covers-you / same-state / nationwide), which
  // replaces the old ilike string match that could never find e.g. a
  // St. Petersburg vendor for a Tampa search. No location -> plain browse,
  // still sortable by date/title. Radius results are always
  // tier-then-distance sorted; the sort control only applies to plain browse.
  let all;
  let locationResolved = true;
  if (params.location?.trim()) {
    const result = await getListingsByLocation(params.location, { category: params.category });
    all = result.listings;
    locationResolved = result.resolvedLabel !== null;
  } else {
    all = await getListings({ category: params.category, sortBy: params.sort || 'date' });
  }

  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const listings = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tier2StartIndex = listings.findIndex((l) => l.searchTier === 2);
  const tier3StartIndex = listings.findIndex((l) => l.searchTier === 3);

  return (
    <div className="container py-10 md:py-14">
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Directory', path: '/directory' }]} />
      {listings.length > 0 && <ListingsItemListJsonLd listings={listings} />}
      <div className="mb-8">
        <p className="eyebrow mb-2">Directory</p>
        <h1 className="font-display text-3xl md:text-4xl mb-2">
          {params.location ? `Vendors in ${params.location}` : 'Find Vendors'}
        </h1>
        {all.length > 0 && (
          <p className="text-muted-foreground">
            {all.length} {all.length === 1 ? 'vendor' : 'vendors'} found
          </p>
        )}
      </div>

      <div className="mb-8">
        <Suspense>
          <SearchBar variant="compact" defaultLocation={params.location} defaultCategory={params.category} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar filters — chip row on mobile, stacked list on desktop */}
        <aside className="space-y-6">
          <div>
            <h3 className="eyebrow mb-3">Categories</h3>
            <ul className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
              <li className="shrink-0 md:shrink">
                <Link
                  href={`/directory${params.location ? `?location=${encodeURIComponent(params.location)}` : ''}`}
                  className={cn(
                    'block px-4 py-2 rounded-full md:rounded-md text-sm whitespace-nowrap transition-colors border md:border-0',
                    !params.category ? 'bg-accent text-accent-foreground font-medium border-transparent' : 'bg-card md:bg-transparent hover:bg-accent/40 md:hover:bg-muted border-border/70 md:border-transparent'
                  )}
                >
                  All Categories
                </Link>
              </li>
              {CATEGORIES.map((cat) => {
                const qs = new URLSearchParams();
                if (params.location) qs.set('location', params.location);
                qs.set('category', cat.slug);
                return (
                  <li key={cat.slug} className="shrink-0 md:shrink">
                    <Link
                      href={`/directory?${qs.toString()}`}
                      className={cn(
                        'block px-4 py-2 rounded-full md:rounded-md text-sm whitespace-nowrap transition-colors border md:border-0',
                        params.category === cat.slug ? 'bg-accent text-accent-foreground font-medium border-transparent' : 'bg-card md:bg-transparent hover:bg-accent/40 md:hover:bg-muted border-border/70 md:border-transparent'
                      )}
                    >
                      {cat.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sort only applies to a plain (no-location) browse — a location
              search is always tier-then-distance sorted, which is the point
              of the search, so the control would be misleading there. */}
          <div className={cn('hidden md:block', params.location && 'md:hidden')}>
            <h3 className="eyebrow mb-3">Sort</h3>
            <ul className="space-y-1">
              {[
                { key: 'date',  label: 'Newest first' },
                { key: 'title', label: 'Name (A–Z)' },
              ].map((opt) => {
                const qs = new URLSearchParams();
                if (params.location) qs.set('location', params.location);
                if (params.category) qs.set('category', params.category);
                qs.set('sort', opt.key);
                return (
                  <li key={opt.key}>
                    <Link
                      href={`/directory?${qs.toString()}`}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm transition-colors',
                        (params.sort || 'date') === opt.key ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted'
                      )}
                    >
                      {opt.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <div>
          {listings.length === 0 ? (
            <div className="rounded-3xl bg-accent/30 border border-accent p-8 md:p-12">
              <div className="max-w-lg mx-auto text-center mb-8">
                <h3 className="font-display text-2xl md:text-3xl mb-3">
                  {params.location && !locationResolved
                    ? `We couldn't find "${params.location}"`
                    : 'Vendors are joining city by city'}
                </h3>
                <p className="text-muted-foreground">
                  {params.location && !locationResolved
                    ? 'Try a city name, "City, ST", or a 5-digit ZIP code — or tell us below and we’ll do the rest.'
                    : 'Tell us your date and city and we’ll connect you as soon as a vendor covers your area — free.'}
                </p>
              </div>
              <div className="max-w-xl mx-auto">
                <LeadForm venueState={params.location} title="Get Free Quotes" />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                Serve this area?{' '}
                <Link href="/submit-listing" className="italic text-primary font-medium hover:underline">
                  List your business free.
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((listing, i) => (
                  <Fragment key={listing.id}>
                    {/* Section headers use `!== -1` (not `> 0`) so a tier still
                        gets an honest label even when it's the very first
                        result — e.g. no vendor's coverage circle reaches the
                        searched location, so results open directly on tier 2
                        (same-state, beyond radius). Without this, those
                        results rendered with no header at all, which could
                        read as "these vendors cover you" when they don't. */}
                    {i === tier2StartIndex && tier2StartIndex !== -1 && (
                      <p className={cn('col-span-full text-sm font-medium text-muted-foreground', tier2StartIndex > 0 ? 'mt-2 pt-4 border-t' : 'mb-1')}>
                        More vendors in the area
                      </p>
                    )}
                    {i === tier3StartIndex && tier3StartIndex !== -1 && (
                      <p className={cn('col-span-full text-sm font-medium text-muted-foreground', tier3StartIndex > 0 ? 'mt-2 pt-4 border-t' : 'mb-1')}>
                        Travels to you
                      </p>
                    )}
                    <ListingCard listing={listing} />
                  </Fragment>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(params, page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Link>
                    </Button>
                  )}
                  <span className="px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(params, page + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageUrl(params: { location?: string; category?: string; sort?: string }, page: number) {
  const qs = new URLSearchParams();
  if (params.location) qs.set('location', params.location);
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  qs.set('page', String(page));
  return `/directory?${qs.toString()}`;
}
