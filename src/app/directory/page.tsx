import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { ListingCard } from '@/components/listing-card';
import { LeadForm } from '@/components/lead-form';
import { Button } from '@/components/ui/button';
import { getListings, getListingsByLocation, getListingFilterFacets } from '@/lib/data/listings';
import { getStateByName, getStateByAbbreviation } from '@/lib/states';
import { PRICE_BANDS, CREW_OPTIONS } from '@/lib/listing-facets';
import { BreadcrumbJsonLd, ListingsItemListJsonLd } from '@/components/json-ld';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  // This page is the natural ranker for the "wedding streaming service" /
  // "wedding livestream vendors" query family (GSC) — the title should carry
  // those terms, not an internal nav label.
  title: 'Wedding Live Streaming Vendor Directory — Search by City & State',
  description:
    'Search professional wedding live streaming vendors in every U.S. state. Compare published starting prices, filter by crew size, and message vendors directly — free for couples.',
  // Every filter/sort/page combination is the same underlying content — point
  // them all at the unfiltered canonical URL so search engines don't treat
  // ?location=&price=&page= combinations as separate duplicate pages.
  alternates: { canonical: '/directory' },
};

const PAGE_SIZE = 12;

// Best-effort: turn a free-text search ("Orlando, FL", "florida", "FL") into a
// full state name for prefilling the lead form's state Select — or undefined.
function resolveStateName(location?: string): string | undefined {
  if (!location) return undefined;
  const trimmed = location.trim();
  const direct = getStateByName(trimmed) ?? (trimmed.length === 2 ? getStateByAbbreviation(trimmed) : undefined);
  if (direct) return direct.name;
  const afterComma = trimmed.split(',').pop()?.trim();
  if (afterComma && afterComma !== trimmed) {
    const viaComma =
      getStateByName(afterComma) ?? (afterComma.length === 2 ? getStateByAbbreviation(afterComma) : undefined);
    if (viaComma) return viaComma.name;
  }
  return undefined;
}

interface DirectoryParams {
  location?: string;
  /** PRICE_BANDS slug */
  price?: string;
  /** CrewType value */
  crew?: string;
  sort?: 'date' | 'title';
  page?: string;
}

interface PageProps {
  searchParams: Promise<DirectoryParams>;
}

/** Same params, minus paging, with one key overridden (or cleared when null). */
function buildFilterUrl(params: DirectoryParams, key: 'price' | 'crew', value: string | null) {
  const qs = new URLSearchParams();
  if (params.location) qs.set('location', params.location);
  if (params.sort) qs.set('sort', params.sort);
  const price = key === 'price' ? value : params.price;
  const crew = key === 'crew' ? value : params.crew;
  if (price) qs.set('price', price);
  if (crew) qs.set('crew', crew);
  const query = qs.toString();
  return query ? `/directory?${query}` : '/directory';
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
  const filters = { priceBand: params.price, crew: params.crew };

  let all;
  let locationResolved = true;
  if (params.location?.trim()) {
    const result = await getListingsByLocation(params.location, filters);
    all = result.listings;
    locationResolved = result.resolvedLabel !== null;
  } else {
    all = await getListings({ ...filters, sortBy: params.sort || 'date' });
  }

  // Price and crew are vendor-supplied and start empty on every listing, so
  // each facet stays hidden until at least one vendor has declared a value.
  // Without this the directory would ship two filters that match nobody.
  const facets = await getListingFilterFacets();
  const showPriceFilter = facets.pricedCount > 0;
  const showCrewFilter = facets.crewCount > 0;
  const anyFilterActive = Boolean(params.price || params.crew);

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
          <SearchBar
            variant="compact"
            defaultLocation={params.location}
            keepParams={{ price: params.price, crew: params.crew }}
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar filters — chip row on mobile, stacked list on desktop.
            Both facets are vendor-declared and hidden until someone has
            declared one, so this aside can legitimately render empty. */}
        <aside className="space-y-6">
          {showPriceFilter && (
            <FilterGroup
              title="Starting price"
              allLabel="Any price"
              allHref={buildFilterUrl(params, 'price', null)}
              allActive={!params.price}
              options={PRICE_BANDS.map((band) => ({
                key: band.slug,
                label: band.label,
                href: buildFilterUrl(params, 'price', band.slug),
                active: params.price === band.slug,
              }))}
            />
          )}

          {showCrewFilter && (
            <FilterGroup
              title="Crew size"
              allLabel="Any crew size"
              allHref={buildFilterUrl(params, 'crew', null)}
              allActive={!params.crew}
              options={CREW_OPTIONS.map((option) => ({
                key: option.value,
                label: option.label,
                href: buildFilterUrl(params, 'crew', option.value),
                active: params.crew === option.value,
              }))}
            />
          )}

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
                if (params.price) qs.set('price', params.price);
                if (params.crew) qs.set('crew', params.crew);
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
                    : anyFilterActive
                      ? 'No vendors match those filters'
                      : 'Vendors are joining city by city'}
                </h3>
                <p className="text-muted-foreground">
                  {params.location && !locationResolved
                    ? 'Try a city name, "City, ST", or a 5-digit ZIP code — or tell us below and we’ll do the rest.'
                    : anyFilterActive
                      ? 'Price and crew size are supplied by vendors themselves, and not everyone has filled them in yet — clearing the filters will show more.'
                      : 'Tell us your date and city and we’ll connect you as soon as a vendor covers your area — free.'}
                </p>
                {anyFilterActive && (
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link
                      href={params.location ? `/directory?location=${encodeURIComponent(params.location)}` : '/directory'}
                    >
                      Clear filters
                    </Link>
                  </Button>
                )}
              </div>
              <div className="max-w-xl mx-auto">
                {/* Only prefill the state when the searched location actually
                    resolves to one — LeadForm's state field is a Select of full
                    state names, so free text like "Orlando, FL" or a ZIP never
                    matched and silently saved junk into venue_state. */}
                <LeadForm venueState={resolveStateName(params.location)} title="Get Free Quotes" />
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

function buildPageUrl(params: DirectoryParams, page: number) {
  const qs = new URLSearchParams();
  if (params.location) qs.set('location', params.location);
  if (params.price) qs.set('price', params.price);
  if (params.crew) qs.set('crew', params.crew);
  if (params.sort) qs.set('sort', params.sort);
  qs.set('page', String(page));
  return `/directory?${qs.toString()}`;
}

interface FilterGroupProps {
  title: string;
  allLabel: string;
  allHref: string;
  allActive: boolean;
  options: { key: string; label: string; href: string; active: boolean }[];
}

/** Chip row on mobile, stacked list on desktop — the layout the category
 *  filter used, kept so the directory's shape doesn't change under vendors. */
function FilterGroup({ title, allLabel, allHref, allActive, options }: FilterGroupProps) {
  const itemClass = (active: boolean) =>
    cn(
      'block px-4 py-2 rounded-full md:rounded-md text-sm whitespace-nowrap transition-colors border md:border-0',
      active
        ? 'bg-accent text-accent-foreground font-medium border-transparent'
        : 'bg-card md:bg-transparent hover:bg-accent/40 md:hover:bg-muted border-border/70 md:border-transparent'
    );

  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible no-scrollbar scroll-fade-r md:[mask-image:none] pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        <li className="shrink-0 md:shrink">
          <Link href={allHref} className={itemClass(allActive)}>
            {allLabel}
          </Link>
        </li>
        {options.map((opt) => (
          <li key={opt.key} className="shrink-0 md:shrink">
            <Link href={opt.href} className={itemClass(opt.active)}>
              {opt.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
