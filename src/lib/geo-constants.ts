// Client-safe geo constants (no Supabase/next/headers imports — this file is
// imported directly by client components like search-bar.tsx). Server-side
// geo logic (DB lookups) lives in src/lib/data/geo.ts, which re-exports these
// for server-side callers.

export interface CitySuggestion {
  name: string;
  stateCode: string;
  label: string;
  lat: number;
  lng: number;
}

export const POPULAR_CITIES: CitySuggestion[] = [
  { name: 'New York City', stateCode: 'NY', label: 'New York City, NY', lat: 40.71427, lng: -74.00597 },
  { name: 'Los Angeles', stateCode: 'CA', label: 'Los Angeles, CA', lat: 34.05223, lng: -118.24368 },
  { name: 'Chicago', stateCode: 'IL', label: 'Chicago, IL', lat: 41.85003, lng: -87.65005 },
  { name: 'Miami', stateCode: 'FL', label: 'Miami, FL', lat: 25.77427, lng: -80.19366 },
  { name: 'Austin', stateCode: 'TX', label: 'Austin, TX', lat: 30.26715, lng: -97.74306 },
  { name: 'Nashville', stateCode: 'TN', label: 'Nashville, TN', lat: 36.16589, lng: -86.78444 },
];
