// Vendor-matching logic for couple-facing lead capture (Get Free Quotes form).
//
// Pure selection logic only — this module never sends email. Uses the
// anon/cookie-aware client (createClient) since matching only needs to read
// already-public data (approved, non-expired listings), the same rows any
// visitor could see on a state/city page.

import { createClient } from '@/lib/supabase/server';
import { resolveLocation } from '@/lib/data/geo';
import { getStateByName } from '@/lib/states';

// Mirrors effectiveTier() in src/lib/data/listings.ts — a listing whose
// featured_until has passed must not be treated as Featured here either,
// regardless of what the tier column still says (no cron dependency).
function effectiveTier(row: any): 'basic' | 'featured' {
  if (row.tier !== 'featured') return 'basic';
  if (!row.featured_until) return 'featured';
  return new Date(row.featured_until) > new Date() ? 'featured' : 'basic';
}

interface MatchArgs {
  state: string;
  city?: string;
  /**
   * The vendor whose own profile the couple was on when they asked for a
   * quote (see sourceVendorForListing). Always matched, and always first.
   */
  sourceVendorId?: string | null;
}

const MAX_MATCHES = 3;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The vendor behind the listing page a quote request was submitted from, or
// null if the id is missing, malformed, or not a live listing.
//
// Until 2026-10 this id was stored on the lead and then ignored: matching took
// the three nearest vendors, so a couple could ask for a quote on one vendor's
// profile and that vendor might never hear about it. A request made on your
// own page is the strongest inquiry there is, so it now always reaches you.
export async function sourceVendorForListing(listingId: unknown): Promise<string | null> {
  if (typeof listingId !== 'string' || !UUID_RE.test(listingId)) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('listings')
    .select('vendor_id')
    .eq('id', listingId)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return (data as { vendor_id: string | null } | null)?.vendor_id ?? null;
}

// Returns up to 3 vendor ids for the given venue location.
//
// Primary path: the same tiered-radius search the directory uses
// (search_listings_by_location, migration 0005) — so a Minneapolis lead
// matches Saint Paul vendors whose service radius covers it, exactly like
// the search page would show them. The RPC already ranks tier asc
// (in-radius → expanded → travels-nationwide), featured desc, distance asc,
// so taking vendor ids in order preserves Featured priority within tiers.
//
// Fallback path (location can't be resolved to coordinates): the original
// city/state text match, so a lead is never dropped just because the couple
// typed a venue town our cities table doesn't know.
//
// When the request came from a specific vendor's profile, that vendor takes
// the first slot and location matching fills the remaining two.
export async function matchVendorsForLead({ state, city, sourceVendorId }: MatchArgs): Promise<string[]> {
  if (!state) return sourceVendorId ? [sourceVendorId] : [];

  let byLocation = await matchByProximity({ state, city });
  if (byLocation.length === 0) byLocation = await matchByText({ state, city });

  if (!sourceVendorId) return byLocation;

  return [sourceVendorId, ...byLocation.filter((id) => id !== sourceVendorId)].slice(0, MAX_MATCHES);
}

async function matchByProximity({ state, city }: MatchArgs): Promise<string[]> {
  if (!city) return []; // state-only leads rank better via the text path

  // Leads store the full state name ("Minnesota"); resolveLocation prefers
  // "City, ST". Convert when possible, otherwise try the bare city.
  const stateCode = getStateByName(state)?.abbreviation ?? null;
  const resolved = await resolveLocation(stateCode ? `${city}, ${stateCode}` : city);
  if (!resolved) return [];
  // A bare-city resolve that landed in a different state is a wrong guess
  // (e.g. "Springfield") — don't match vendors in the wrong state.
  if (stateCode && resolved.stateCode !== stateCode) return [];

  const supabase = await createClient();
  const { data: rpcRows, error } = await supabase.rpc('search_listings_by_location', {
    search_lat: resolved.lat,
    search_lng: resolved.lng,
    search_state: resolved.stateName ?? state,
    // Lead matching never narrows by the vendor-declared filters — a couple
    // submitting a lead hasn't expressed a price or crew preference, and
    // filtering here would silently drop every vendor who hasn't filled
    // those in.
    min_price_cents: null,
    max_price_cents: null,
    crew_filter: null,
    result_limit: 24,
  });
  if (error || !rpcRows || rpcRows.length === 0) return [];

  const ids = (rpcRows as { listing_id: string }[]).map((r) => r.listing_id);
  const { data: listings } = await supabase
    .from('listings')
    .select('id, vendor_id')
    .in('id', ids);
  if (!listings) return [];

  const vendorByListing = new Map((listings as any[]).map((l) => [l.id, l.vendor_id]));

  // Preserve the RPC's ordering; dedupe by vendor.
  const seen = new Set<string>();
  const vendorIds: string[] = [];
  for (const id of ids) {
    const vendorId = vendorByListing.get(id);
    if (!vendorId || seen.has(vendorId)) continue;
    seen.add(vendorId);
    vendorIds.push(vendorId);
    if (vendorIds.length >= MAX_MATCHES) break;
  }
  return vendorIds;
}

// Original behavior: exact city+state text match, then state-only.
async function matchByText({ state, city }: MatchArgs): Promise<string[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  async function fetchRows(withCity: boolean) {
    let query = supabase
      .from('listings')
      .select('vendor_id, tier, featured_until')
      .eq('status', 'approved')
      .gt('expires_at', nowIso)
      .ilike('state', state);

    if (withCity && city) {
      query = query.ilike('city', city);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as any[];
  }

  let rows = city ? await fetchRows(true) : [];
  if (rows.length === 0) {
    rows = await fetchRows(false);
  }
  if (rows.length === 0) return [];

  // Rank Featured first (stable order otherwise), dedupe by vendor_id.
  const ranked = [...rows].sort((a, b) => {
    const aFeatured = effectiveTier(a) === 'featured';
    const bFeatured = effectiveTier(b) === 'featured';
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
    return 0;
  });

  const seen = new Set<string>();
  const vendorIds: string[] = [];
  for (const row of ranked) {
    if (!row.vendor_id || seen.has(row.vendor_id)) continue;
    seen.add(row.vendor_id);
    vendorIds.push(row.vendor_id);
    if (vendorIds.length >= MAX_MATCHES) break;
  }

  // Email notifications for matched vendors are sent by the caller
  // (src/app/api/leads/route.ts) — this function only selects vendors.

  return vendorIds;
}
