// Vendor-declared listing facts, and the filters built on them.
//
// Replaces src/lib/categories.ts. The six categories this supersedes were
// assigned by our seed imports rather than chosen by vendors, so they filtered
// on nothing verifiable. Everything here is supplied by the vendor on their own
// listing and starts empty — see migration 0014.

export type CrewType = 'solo' | 'duo' | 'crew';

export interface CrewOption {
  value: CrewType;
  /** Full sentence-ish label — used on the vendor form, where the vendor is
   *  choosing and needs the distinction spelled out. */
  label: string;
  /** Compact label — used on cards and the listing page, where space is tight. */
  shortLabel: string;
  description: string;
}

export const CREW_OPTIONS: CrewOption[] = [
  {
    value: 'solo',
    label: 'Solo operator',
    shortLabel: 'Solo operator',
    description: 'One person, typically a single camera.',
  },
  {
    value: 'duo',
    label: 'Two-person crew',
    shortLabel: '2-person crew',
    description: 'Two operators, usually multi-camera.',
  },
  {
    value: 'crew',
    label: 'Full crew (3 or more)',
    shortLabel: 'Full crew',
    description: 'Three or more, multi-camera with a dedicated audio or director role.',
  },
];

export function getCrewOption(value: string | null | undefined): CrewOption | undefined {
  if (!value) return undefined;
  return CREW_OPTIONS.find((o) => o.value === value);
}

export interface PriceBand {
  slug: string;
  label: string;
  /** Inclusive lower bound in cents, or null for open-ended. */
  minCents: number | null;
  /** Inclusive upper bound in cents, or null for open-ended. */
  maxCents: number | null;
}

// Bounds are inclusive on both ends and expressed in cents, matching the
// RPC's `>= min` / `<= max` comparison. The bands are deliberately coarse:
// three buckets a couple can reason about, not a slider.
export const PRICE_BANDS: PriceBand[] = [
  { slug: 'under-1000', label: 'Under $1,000',      minCents: null,   maxCents: 99_999 },
  { slug: '1000-2499',  label: '$1,000 – $2,499',   minCents: 100_000, maxCents: 249_999 },
  { slug: '2500-plus',  label: '$2,500 and up',     minCents: 250_000, maxCents: null },
];

export function getPriceBand(slug: string | null | undefined): PriceBand | undefined {
  if (!slug) return undefined;
  return PRICE_BANDS.find((b) => b.slug === slug);
}

/** "From $1,200" — whole dollars, since no vendor prices a wedding at $1,200.50. */
export function formatStartingPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  const dollars = Math.round(cents / 100);
  return `From ${dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })}`;
}

// Matches the CHECK constraint in migration 0014 ($50–$50,000). Kept in sync
// deliberately: the form should reject a bad number with a readable message
// rather than letting Postgres reject it with a constraint-violation string.
export const MIN_PRICE_CENTS = 5_000;
export const MAX_PRICE_CENTS = 5_000_000;

/**
 * Parse whatever a vendor typed into the price field ("1200", "$1,200",
 * "1200.00") into cents. Returns null for empty input, or an error message.
 */
export function parsePriceInput(
  input: string
): { cents: number | null; error: null } | { cents: null; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { cents: null, error: null };

  const cleaned = trimmed.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { cents: null, error: 'Enter a number, like 1200.' };
  }

  const cents = Math.round(parseFloat(cleaned) * 100);
  if (cents < MIN_PRICE_CENTS) {
    return { cents: null, error: 'That looks too low — enter your starting package price, at least $50.' };
  }
  if (cents > MAX_PRICE_CENTS) {
    return { cents: null, error: 'That looks too high — the maximum is $50,000.' };
  }
  return { cents, error: null };
}

/** Cents back into the plain digits the form input shows ("120000" -> "1200"). */
export function priceCentsToInput(cents: number | null | undefined): string {
  if (cents == null) return '';
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}
