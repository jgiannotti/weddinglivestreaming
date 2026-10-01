// Founding-vendor offer (server-only). Decided by Joe on 2026-10-01.
//
// A vendor who owns their listing (claimed it, or created it) and has finished
// it with a starting price and a cover photo gets Featured free for six
// months. No card, no auto-charge: when the six months end the listing reads
// as Basic again on its own (effectiveTier() and the search RPC both check
// featured_until at read time), unless the vendor chooses to subscribe.
//
// Why it exists: at launch volume nobody can justify paying for placement, so
// Featured sat empty and the directory looked unclaimed. This gives the vendors
// who do the work of completing a profile the visible reward, fills the
// homepage spotlight with real businesses, and adds real prices to the dataset
// behind the cost-by-state page.
//
// Once per account. The decision and the write live in one database function,
// grant_founding_vendor() (migration 0018), so the eligibility check, the
// listing update and the "already granted" marker on the account are a single
// transaction. The marker is profiles.founding_granted_at, a column signed-in
// users cannot write, so the offer cannot be collected twice by deleting and
// re-adding a listing, and it is not handed out again when a cleanup job
// resets an expired listing.
//
// If migration 0018 has not been applied yet, every call here fails closed:
// nothing is granted and no offer is shown. Nothing else on the site depends
// on it.

import { createAdminClient } from '@/lib/supabase/server';
import {
  FOUNDING_MONTHS,
  addMonths,
  foundingView,
  type FoundingListingRow,
  type FoundingView,
} from '@/lib/founding-shared';

export { FOUNDING_MONTHS, addMonths, foundingView };
export type { FoundingListingRow, FoundingView };

const NONE: FoundingView = { state: 'none' };

export interface FoundingGrantResult {
  granted: boolean;
  /** Set when granted now, or when founding was already running. */
  until?: string;
  view: FoundingView;
}

/**
 * Where a vendor stands with the founding offer, read with the service role.
 * Only ever call this for a vendor the caller is allowed to see (their own, or
 * from an admin route). Any failure reads as "no offer".
 */
export async function getFoundingView(vendorId: string): Promise<FoundingView> {
  if (!vendorId) return NONE;
  try {
    const admin = await createAdminClient();

    const { data: vendor, error: vendorErr } = await admin
      .from('vendors')
      .select('id, user_id')
      .eq('id', vendorId)
      .maybeSingle();
    const ownerId = (vendor as { user_id: string | null } | null)?.user_id;
    // Ownerless (seeded, unclaimed) vendors never qualify. The offer is the
    // reward for claiming.
    if (vendorErr || !ownerId) return NONE;

    const [profileRes, ownedRes, listingsRes] = await Promise.all([
      admin.from('profiles').select('founding_granted_at').eq('id', ownerId).maybeSingle(),
      admin.from('vendors').select('id').eq('user_id', ownerId),
      admin
        .from('listings')
        .select('id, status, tier, featured_until, starting_price_cents, hero_image_url')
        .eq('vendor_id', vendorId),
    ]);
    if (profileRes.error || ownedRes.error || listingsRes.error || !profileRes.data) return NONE;

    // A paying or formerly paying customer, on any vendor this account owns.
    const ownedIds = ((ownedRes.data as { id: string }[] | null) ?? []).map((v) => v.id);
    const subs = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('vendor_id', ownedIds.length > 0 ? ownedIds : [vendorId]);
    if (subs.error) return NONE;

    return foundingView(
      (listingsRes.data as FoundingListingRow[] | null) ?? [],
      (subs.count ?? 0) > 0,
      new Date(),
      (profileRes.data as { founding_granted_at: string | null }).founding_granted_at ?? null
    );
  } catch (err) {
    console.error('[founding] view threw', err);
    return NONE;
  }
}

/**
 * Apply the founding offer to a vendor if they qualify right now. Safe to call
 * any number of times and from any server path (claim approval, listing
 * approval, listing edit): the database grants at most once per account.
 */
export async function maybeGrantFounding(vendorId: string): Promise<FoundingGrantResult> {
  if (!vendorId) return { granted: false, view: NONE };

  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.rpc('grant_founding_vendor', {
      p_vendor_id: vendorId,
      p_months: FOUNDING_MONTHS,
    });

    if (error) {
      console.error('[founding] grant failed', { vendorId, message: error.message });
      return { granted: false, view: await getFoundingView(vendorId) };
    }

    if (typeof data === 'string' && data) {
      const until = new Date(data).toISOString();
      return { granted: true, until, view: { state: 'active', until } };
    }

    const view = await getFoundingView(vendorId);
    return { granted: false, until: view.state === 'active' ? view.until : undefined, view };
  } catch (err) {
    // Never let the offer break the request it rides along with.
    console.error('[founding] threw', err);
    return { granted: false, view: NONE };
  }
}
