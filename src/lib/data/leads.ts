// Vendor-matching logic for couple-facing lead capture (Get Free Quotes form).
//
// Pure selection logic only — this module never sends email. Uses the
// anon/cookie-aware client (createClient) since matching only needs to read
// already-public data (approved, non-expired listings), the same rows any
// visitor could see on a state/city page.

import { createClient } from '@/lib/supabase/server';

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
}

// Returns up to 3 vendor ids for the given venue location, Featured vendors
// ranked ahead of Basic. Tries city+state first; falls back to state-only if
// no listings match the city (or no city was provided).
export async function matchVendorsForLead({ state, city }: MatchArgs): Promise<string[]> {
  if (!state) return [];

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
    if (vendorIds.length >= 3) break;
  }

  // Email notifications for matched vendors are sent by the caller
  // (src/app/api/leads/route.ts) — this function only selects vendors.

  return vendorIds;
}
