// Live Supabase data-access layer for public-facing listing/vendor reads.
//
// Always queries through the anon/cookie-aware client (createClient) — never
// the service-role client — because RLS already scopes these tables correctly
// for public consumption (approved listings only, plus their photos/vendor).
// Every function here is async.

import { createClient } from '@/lib/supabase/server';
import type { Listing, Vendor } from '@/lib/types';
import { getPriceBand, type CrewType } from '@/lib/listing-facets';
import { resolveLocation } from '@/lib/data/geo';

// Nested select: pulls the parent vendor (FK listings.vendor_id -> vendors.id).
const LISTING_SELECT = `
  *,
  vendor:vendors(*)
`;

function mapVendor(row: any): Vendor {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    businessName: row.business_name,
    slug: row.slug,
    bio: row.bio,
    websiteUrl: row.website_url,
    phone: row.phone,
    memberSince: row.member_since,
    source: row.source ?? 'signup',
    claimedAt: row.claimed_at ?? null,
  };
}

// Tier/expiry integrity, enforced at read time (never relying on the nightly
// downgrade_expired_featured() cron to have run yet). A listing whose
// featured_until has already passed reads back as 'basic' immediately,
// regardless of what the tier column still says in the DB. Per plan: no
// query-time enforcement here would mean vendors who stop paying keep
// Featured forever until a cron happens to run.
function effectiveTier(row: any): 'basic' | 'featured' {
  if (row.tier !== 'featured') return 'basic';
  if (!row.featured_until) return 'featured';
  return new Date(row.featured_until) > new Date() ? 'featured' : 'basic';
}

function mapListing(row: any): Listing {
  const tier = effectiveTier(row);

  return {
    id: row.id,
    vendorId: row.vendor_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    heroImageUrl: row.hero_image_url,
    city: row.city,
    state: row.state,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    tier,
    featuredUntil: tier === 'featured' ? row.featured_until : null,
    websiteUrl: row.website_url,
    viewCount: row.view_count,
    inquiryCount: row.inquiry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    serviceRadiusMiles: row.service_radius_miles ?? 60,
    travelsNationwide: row.travels_nationwide ?? false,
    startingPriceCents: row.starting_price_cents ?? null,
    crewType: (row.crew_type as CrewType | null) ?? null,
    vendor: row.vendor ? mapVendor(row.vendor) : undefined,
  };
}

// Featured tier always ranks above basic, regardless of requested sort.
// Array.prototype.sort is spec-guaranteed stable, so returning 0 for same-tier
// rows preserves whatever order the DB query already applied (date or title).
function sortByTierFirst(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'featured' ? -1 : 1;
    return 0;
  });
}

// ----------------------------------------------------------------------------
// Milestone 2 — tiered radius search. Replaces ilike city/state string
// matching (which silently missed e.g. a St. Petersburg vendor covering a
// Tampa search). Resolves the free-text location to coordinates via the
// own-DB cities/zips backbone, then calls the search_listings_by_location
// Postgres function (migration 0005) which does the tier1/2/3 ranking.
// ----------------------------------------------------------------------------
export interface RadiusSearchResult {
  listings: Listing[];
  resolvedLabel: string | null;
  /** True when tier1 (in-radius) results were thin and tier2/3 were included. */
  expanded: boolean;
}

/**
 * Vendor-declared filters (migration 0014), shared by radius search and plain
 * browse. A listing that hasn't declared a value can't match a filter on it —
 * "under $1,000" means vendors known to be under $1,000, never "everyone we
 * have no price for."
 */
export interface ListingFilters {
  /** A PRICE_BANDS slug. Unknown slugs are ignored rather than returning nothing. */
  priceBand?: string;
  /** A CrewType value. */
  crew?: string;
}

export async function getListingsByLocation(
  locationInput: string,
  opts: ListingFilters & { limit?: number } = {}
): Promise<RadiusSearchResult> {
  const resolved = await resolveLocation(locationInput);
  if (!resolved) {
    return { listings: [], resolvedLabel: null, expanded: false };
  }

  const band = getPriceBand(opts.priceBand);

  const supabase = await createClient();
  const { data: rpcRows, error: rpcError } = await supabase.rpc('search_listings_by_location', {
    search_lat: resolved.lat,
    search_lng: resolved.lng,
    search_state: resolved.stateName,
    min_price_cents: band?.minCents ?? null,
    max_price_cents: band?.maxCents ?? null,
    crew_filter: opts.crew ?? null,
    result_limit: opts.limit ?? 60,
  });

  if (rpcError || !rpcRows || rpcRows.length === 0) {
    return { listings: [], resolvedLabel: resolved.label, expanded: false };
  }

  const rows = rpcRows as {
    listing_id: string;
    distance_miles: number;
    search_tier: 1 | 2 | 3;
    is_featured: boolean;
  }[];

  // Tier1-only unless tier1 is thin (<5), matching the plan's display rule:
  // "Tier 2 (if <5 results): expand ... Tier 3: always available as a
  // last-resort 'Travels to you' section." Tier 3 is always appended
  // separately by the caller if desired — here we return everything the
  // RPC gave us (already capped) and let the UI decide section headers via
  // searchTier; but we drop tier2 entirely when tier1 already has >=5.
  const tier1Count = rows.filter((r) => r.search_tier === 1).length;
  const filteredRows = tier1Count >= 5 ? rows.filter((r) => r.search_tier !== 2) : rows;
  const expanded = filteredRows.some((r) => r.search_tier !== 1);

  const ids = filteredRows.map((r) => r.listing_id);
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', ids);

  if (error || !data) {
    return { listings: [], resolvedLabel: resolved.label, expanded: false };
  }

  const byId = new Map((data as any[]).map((row) => [row.id, row]));
  const distanceById = new Map(filteredRows.map((r) => [r.listing_id, r.distance_miles]));
  const tierById = new Map(filteredRows.map((r) => [r.listing_id, r.search_tier]));

  // Preserve the RPC's tier/distance/featured ordering exactly — it already
  // applied the correct sort (tier asc, featured desc, distance asc).
  const listings = ids
    .map((id) => byId.get(id))
    .filter((row): row is any => !!row)
    .map((row) => {
      const listing = mapListing(row);
      listing.distanceMiles = distanceById.get(row.id);
      listing.searchTier = tierById.get(row.id);
      return listing;
    });

  return { listings, resolvedLabel: resolved.label, expanded };
}

export async function getListings(
  opts: ListingFilters & {
    state?: string;
    city?: string;
    search?: string;
    limit?: number;
    sortBy?: 'date' | 'title';
  } = {}
): Promise<Listing[]> {
  const supabase = await createClient();

  // Expired listings drop from every public page (query-time enforcement,
  // no cron dependency) but stay visible in the vendor's own dashboard via
  // getListingsByVendor, which does not apply this filter.
  let query = supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString());

  if (opts.state) {
    // ilike with no wildcards = case-insensitive equality, matching the
    // previous exact (but case-insensitive) state-name comparison.
    query = query.ilike('state', opts.state);
  }

  if (opts.city) {
    query = query.ilike('city', opts.city);
  }

  // Vendor-declared filters. Both compare against a nullable column, and
  // Postgres drops NULL rows from `>=` / `<=` / `=` comparisons on its own —
  // which is exactly the intended semantics (no declared value = no match).
  const band = getPriceBand(opts.priceBand);
  if (band) {
    if (band.minCents !== null) query = query.gte('starting_price_cents', band.minCents);
    if (band.maxCents !== null) query = query.lte('starting_price_cents', band.maxCents);
    // An open-ended band on both sides would otherwise let priceless rows
    // through, since neither bound was applied.
    if (band.minCents === null && band.maxCents === null) {
      query = query.not('starting_price_cents', 'is', null);
    }
  }

  if (opts.crew) {
    query = query.eq('crew_type', opts.crew);
  }

  if (opts.search) {
    const q = `%${opts.search.replace(/[%,]/g, '')}%`;
    query = query.or(
      `title.ilike.${q},city.ilike.${q},state.ilike.${q},description.ilike.${q}`
    );
  }

  if (opts.sortBy === 'title') {
    query = query.order('title', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let results = sortByTierFirst((data as any[]).map(mapListing));
  if (opts.limit) results = results.slice(0, opts.limit);
  return results;
}

export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .eq('tier', 'featured')
    .gt('expires_at', nowIso)
    // Only genuinely-still-featured rows — a row whose featured_until has
    // passed but hasn't been downgraded by the cron yet must not occupy a
    // Featured carousel slot (effectiveTier() would relabel it 'basic' after
    // fetch, but by then it would have already taken a slot from a real
    // Featured vendor).
    .or(`featured_until.is.null,featured_until.gte.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as any[]).map(mapListing);
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapListing(data);
}

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapVendor(data);
}

export async function getListingsByVendor(vendorId: string): Promise<Listing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('vendor_id', vendorId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map(mapListing);
}

// Homepage trust-stat line needs real counts — never hardcode vendor/state
// numbers, since they were wrong the moment the WP migration source
// disappeared. Returns 0s safely if the query fails.
export async function getListingStats(): Promise<{ vendorCount: number; stateCount: number }> {
  const supabase = await createClient();

  const { count: vendorCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { data: stateRows } = await supabase
    .from('listings')
    .select('state')
    .eq('status', 'approved');

  const stateCount = new Set((stateRows ?? []).map((r: any) => r.state)).size;

  return { vendorCount: vendorCount ?? 0, stateCount };
}

// Distinct (state, city) pairs that have at least one approved listing.
// Drives the programmatic city pages (/wedding-live-streaming-[state]/[city])
// and their sitemap entries — a city only gets a page once a real vendor
// exists there, so this never generates thin/empty pages.
export async function getCitiesWithListings(): Promise<{ state: string; city: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('state, city')
    .eq('status', 'approved');

  if (error || !data) return [];

  const seen = new Set<string>();
  const pairs: { state: string; city: string }[] = [];
  for (const row of data as any[]) {
    const key = `${row.state}|${row.city}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ state: row.state, city: row.city });
    }
  }
  return pairs;
}

/**
 * "Other vendors you might consider" on a listing page.
 *
 * Previously matched on shared category, which produced near-random pairings:
 * 94 listings shared the Multi-Camera & Cinematic label, so a Florida vendor
 * was routinely "related" to one in Oregon. Now it matches on the same state
 * first — a couple looking at a Tampa vendor can plausibly book any of these —
 * and tops up with nationwide-travelling vendors when the state is thin.
 *
 * Featured listings sort ahead of basic within each group, consistent with
 * every other listing surface on the site.
 */
export async function getRelatedListings(listing: Listing, limit = 3): Promise<Listing[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: sameState } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .gt('expires_at', nowIso)
    .ilike('state', listing.state)
    .neq('id', listing.id)
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  const results = sortByTierFirst((sameState ?? []).map(mapListing)).slice(0, limit);
  if (results.length >= limit) return results;

  // Thin state — fill the remaining slots with vendors who travel anywhere.
  const seen = new Set([listing.id, ...results.map((l) => l.id)]);
  const { data: nationwide } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .gt('expires_at', nowIso)
    .eq('travels_nationwide', true)
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  const fillers = sortByTierFirst((nationwide ?? []).map(mapListing)).filter((l) => !seen.has(l.id));
  return [...results, ...fillers].slice(0, limit);
}

/**
 * How many approved listings have declared each vendor-supplied fact.
 *
 * The directory uses this to hide a filter entirely until at least one vendor
 * has filled it in. Both columns start empty on every row (nothing was
 * backfilled when categories were retired), so rendering the controls
 * unconditionally would mean shipping filters that match zero vendors.
 */
export async function getListingFilterFacets(): Promise<{ pricedCount: number; crewCount: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('listing_filter_facets');

  if (error || !data || (data as any[]).length === 0) {
    return { pricedCount: 0, crewCount: 0 };
  }

  const row = (data as any[])[0];
  return {
    pricedCount: Number(row.priced_count ?? 0),
    crewCount: Number(row.crew_count ?? 0),
  };
}
