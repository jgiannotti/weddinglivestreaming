// Live Supabase data-access layer for public-facing listing/vendor reads.
//
// Replaces src/data/mock-listings.ts. Always queries through the anon/cookie-aware
// client (createClient) — never the service-role client — because RLS already
// scopes these tables correctly for public consumption (approved listings only,
// plus their categories/photos/vendor). Every function here is async.

import { createClient } from '@/lib/supabase/server';
import type { Listing, Vendor, Category } from '@/lib/types';

// Nested select: pulls the parent vendor (FK listings.vendor_id -> vendors.id)
// and every category linked through the listing_categories join table.
const LISTING_SELECT = `
  *,
  vendor:vendors(*),
  listing_categories(categories(*))
`;

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
  };
}

function mapVendor(row: any): Vendor {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    slug: row.slug,
    bio: row.bio,
    websiteUrl: row.website_url,
    phone: row.phone,
    memberSince: row.member_since,
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
  const categories: Category[] = (row.listing_categories ?? [])
    .map((lc: any) => lc.categories)
    .filter((c: any): c is any => !!c)
    .map(mapCategory)
    .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);

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
    categories,
    viewCount: row.view_count,
    inquiryCount: row.inquiry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
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

export async function getListings(
  opts: {
    state?: string;
    city?: string;
    category?: string;
    search?: string;
    limit?: number;
    sortBy?: 'date' | 'title';
  } = {}
): Promise<Listing[]> {
  const supabase = await createClient();

  // Category filter: resolve to a set of listing ids first, since filtering
  // through a many-to-many join in a single embedded query is unreliable
  // in supabase-js's query builder.
  let listingIds: string[] | null = null;
  if (opts.category) {
    const { data: categoryRow } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', opts.category)
      .maybeSingle();

    if (!categoryRow) return [];

    const { data: linkRows } = await supabase
      .from('listing_categories')
      .select('listing_id')
      .eq('category_id', categoryRow.id);

    listingIds = (linkRows ?? []).map((r: any) => r.listing_id);
    if (listingIds.length === 0) return [];
  }

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

  if (listingIds) {
    query = query.in('id', listingIds);
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

export async function getRelatedListings(listing: Listing, limit = 3): Promise<Listing[]> {
  if (listing.categories.length === 0) return [];

  const supabase = await createClient();
  const categoryIds = listing.categories.map((c) => c.id);

  const { data: linkRows } = await supabase
    .from('listing_categories')
    .select('listing_id')
    .in('category_id', categoryIds)
    .neq('listing_id', listing.id);

  const candidateIds = Array.from(new Set((linkRows ?? []).map((r: any) => r.listing_id)));
  if (candidateIds.length === 0) return [];

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .in('id', candidateIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as any[]).map(mapListing);
}
