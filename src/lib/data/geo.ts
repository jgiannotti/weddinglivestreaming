// Location resolution + type-ahead against the own-DB cities/zips backbone
// (Milestone 2). No live geocoding API calls here — Mapbox's free Temporary
// Geocoding API forbids persisting results, so stored coordinates always
// come from the bundled GeoNames dataset (migration 0005). Mapbox is only
// ever used client-side for live autocomplete suggestions (see
// src/components/search-bar.tsx), never for storage.

import { createClient } from '@/lib/supabase/server';
import { getStateByName, getStateByAbbreviation } from '@/lib/states';
import type { CitySuggestion } from '@/lib/geo-constants';
export type { CitySuggestion } from '@/lib/geo-constants';
export { POPULAR_CITIES } from '@/lib/geo-constants';

export interface ResolvedLocation {
  lat: number;
  lng: number;
  /** USPS 2-letter code, e.g. "FL" */
  stateCode: string;
  /** Full state name, e.g. "Florida" — matches listings.state values */
  stateName: string | null;
  city: string | null;
  label: string;
}

const ZIP_RE = /^\d{5}$/;

// "Tampa, FL" / "Tampa FL" / "Tampa" — best-effort split so an exact
// city+state match can be preferred over a same-named city in another state.
function parseCityState(input: string): { city: string; stateCode: string | null } {
  const trimmed = input.trim();
  const commaMatch = trimmed.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (commaMatch) return { city: commaMatch[1].trim(), stateCode: commaMatch[2].toUpperCase() };

  const spaceMatch = trimmed.match(/^(.+)\s+([A-Za-z]{2})$/);
  if (spaceMatch) {
    // Only treat the trailing token as a state code if it isn't just the
    // last word of a normal one-word city name (avoid "Reno" -> "Re"+"no").
    const candidateState = spaceMatch[2].toUpperCase();
    if (US_CODES.has(candidateState)) return { city: spaceMatch[1].trim(), stateCode: candidateState };
  }
  return { city: trimmed, stateCode: null };
}

const US_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

function stateNameFromCode(code: string): string | null {
  return getStateByAbbreviation(code)?.name ?? null;
}

/**
 * Resolve free-text search input (city name, "City, ST", or ZIP) to
 * coordinates + state, using only the own-DB cities/zips tables.
 * Exact match first, then population-ranked prefix fallback.
 */
export async function resolveLocation(input: string): Promise<ResolvedLocation | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const supabase = await createClient();

  if (ZIP_RE.test(trimmed)) {
    const { data } = await supabase
      .from('zips')
      .select('zip, city, state_code, lat, lng')
      .eq('zip', trimmed)
      .maybeSingle();
    if (data) {
      return {
        lat: data.lat,
        lng: data.lng,
        stateCode: data.state_code,
        stateName: stateNameFromCode(data.state_code),
        city: data.city,
        label: `${data.city}, ${data.state_code} ${data.zip}`,
      };
    }
    return null;
  }

  const { city, stateCode } = parseCityState(trimmed);

  // Exact match (case-insensitive), preferring the parsed state if given.
  let query = supabase
    .from('cities')
    .select('name, state_code, lat, lng, population')
    .ilike('name', city);
  if (stateCode) query = query.eq('state_code', stateCode);
  const { data: exact } = await query.order('population', { ascending: false }).limit(1);

  const row = exact?.[0];
  if (row) {
    return {
      lat: row.lat,
      lng: row.lng,
      stateCode: row.state_code,
      stateName: stateNameFromCode(row.state_code),
      city: row.name,
      label: `${row.name}, ${row.state_code}`,
    };
  }

  // Fallback: prefix match, most-populous first (handles typos like
  // "St Pete" not exactly matching "St. Petersburg" — imperfect but better
  // than a dead end; real precision comes from the type-ahead UI picking a
  // suggestion before submit).
  let prefixQuery = supabase
    .from('cities')
    .select('name, state_code, lat, lng, population')
    .ilike('name', `${city}%`);
  if (stateCode) prefixQuery = prefixQuery.eq('state_code', stateCode);
  const { data: prefix } = await prefixQuery.order('population', { ascending: false }).limit(1);

  const prefixRow = prefix?.[0];
  if (prefixRow) {
    return {
      lat: prefixRow.lat,
      lng: prefixRow.lng,
      stateCode: prefixRow.state_code,
      stateName: stateNameFromCode(prefixRow.state_code),
      city: prefixRow.name,
      label: `${prefixRow.name}, ${prefixRow.state_code}`,
    };
  }

  // Last resort: maybe the input is a full state name ("Florida") — resolve
  // to that state's population-weighted centroid-ish largest city so a
  // bare state search still returns something instead of nothing.
  const stateInfo = getStateByName(trimmed);
  if (stateInfo) {
    const { data: biggest } = await supabase
      .from('cities')
      .select('name, state_code, lat, lng')
      .eq('state_code', stateInfo.abbreviation)
      .order('population', { ascending: false })
      .limit(1);
    const b = biggest?.[0];
    if (b) {
      return {
        lat: b.lat,
        lng: b.lng,
        stateCode: b.state_code,
        stateName: stateInfo.name,
        city: null,
        label: stateInfo.name,
      };
    }
  }

  return null;
}

/**
 * Population-ranked prefix search against the own-DB cities table. Debounced
 * on the client; this function itself is a thin, fast, cacheable read.
 */
export async function suggestCities(prefix: string, limit = 8): Promise<CitySuggestion[]> {
  const trimmed = prefix.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('suggest_cities', {
    prefix: trimmed,
    result_limit: limit,
  });
  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    name: row.name,
    stateCode: row.state_code,
    label: `${row.name}, ${row.state_code}`,
    lat: row.lat,
    lng: row.lng,
  }));
}

