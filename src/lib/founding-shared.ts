// Founding-vendor offer: the rules, with no server dependencies.
//
// Split from src/lib/founding.ts so that client components (the listing forms)
// can show the offer without pulling the service-role Supabase client into the
// browser bundle. See founding.ts for what the offer is and why it exists.

export const FOUNDING_MONTHS = 6;

export interface FoundingListingRow {
  id: string;
  status: string;
  tier: string;
  featured_until: string | null;
  starting_price_cents: number | null;
  hero_image_url: string | null;
}

export type FoundingView =
  /** Founding Featured is running. */
  | { state: 'active'; until: string }
  /** Qualifies right now; the grant just has not been applied yet. */
  | { state: 'ready' }
  /** Owns an approved listing that still lacks a price and/or a photo. */
  | { state: 'incomplete'; missing: Array<'price' | 'photo'> }
  /** Listing is still waiting for approval. */
  | { state: 'pending' }
  /** Nothing approved and nothing waiting: the listing was not approved. */
  | { state: 'rejected' }
  /**
   * The free period was granted and is over. endedOn is null when the date is
   * not known to have passed (for example an admin ended it early).
   */
  | { state: 'ended'; endedOn: string | null }
  /** Paying (or previously paying) customer, or Featured some other way. */
  | { state: 'none' };

function isComplete(l: FoundingListingRow): boolean {
  return l.starting_price_cents != null && !!l.hero_image_url;
}

/**
 * What to show a vendor about the founding offer. Pure: callers pass the
 * vendor's own listings, whether any subscription row exists for them, and
 * when the offer was granted to the account (profiles.founding_granted_at,
 * migration 0018), if it ever was.
 *
 * This is for display. Whether a grant may happen is decided in one place,
 * the grant_founding_vendor() database function.
 */
export function foundingView(
  listings: FoundingListingRow[],
  hasSubscriptionHistory: boolean,
  now: Date = new Date(),
  grantedAt: string | null = null
): FoundingView {
  if (hasSubscriptionHistory) return { state: 'none' };

  // Featured with an end date still ahead.
  const live = listings
    .filter((l) => l.tier === 'featured' && l.featured_until && new Date(l.featured_until) > now)
    .map((l) => l.featured_until as string)
    .sort();
  // Featured with no end date: set by hand, outside the offer.
  const comped = listings.some((l) => l.tier === 'featured' && !l.featured_until);

  if (grantedAt) {
    if (live.length > 0) return { state: 'active', until: live[live.length - 1] };
    // Still Featured by a standing arrangement: nothing has ended for them.
    if (comped) return { state: 'none' };
    // The free period is over. The end date is still on the listing unless a
    // cleanup job has reset it, in which case it was six months after the grant.
    const ends = listings
      .map((l) => l.featured_until)
      .filter((d): d is string => !!d)
      .sort();
    const end = ends.length > 0 ? ends[ends.length - 1] : addMonths(new Date(grantedAt), FOUNDING_MONTHS).toISOString();
    return { state: 'ended', endedOn: new Date(end) <= now ? end : null };
  }

  // No grant on record. Featured now or in the past some other way (comped by
  // hand, or a purchase whose record has not landed yet): not a founding
  // vendor, so never described as one, and not offered the free period on top.
  if (live.length > 0 || comped || listings.some((l) => l.featured_until != null)) return { state: 'none' };

  const approved = listings.filter((l) => l.status === 'approved');
  if (approved.length === 0) {
    const waiting = listings.length === 0 || listings.some((l) => l.status === 'pending');
    return waiting ? { state: 'pending' } : { state: 'rejected' };
  }
  if (approved.some(isComplete)) return { state: 'ready' };

  // Report what the most complete approved listing still needs.
  const best = [...approved].sort(
    (a, b) =>
      Number(b.starting_price_cents != null) + Number(!!b.hero_image_url) -
      (Number(a.starting_price_cents != null) + Number(!!a.hero_image_url))
  )[0];
  const missing: Array<'price' | 'photo'> = [];
  if (best.starting_price_cents == null) missing.push('price');
  if (!best.hero_image_url) missing.push('photo');
  return { state: 'incomplete', missing };
}

/** "April 1, 2027". UTC, so the date never shifts with the reader's time zone. */
export function formatFoundingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function addMonths(date: Date, months: number): Date {
  const out = new Date(date.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}
