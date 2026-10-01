// "Which vendor does this account manage?"
//
// An account is meant to manage one vendor, and every dashboard page assumes
// so. Nothing in the database enforces it yet, and a bare .maybeSingle()
// returns null when it meets two rows, so with a second vendor row (left
// behind by an interrupted sign-up, say) the Leads page said "you don't have a
// vendor profile", checkout said "create a listing first", and the overview
// could pick the empty one. Every page now asks this one function, which
// always gives the same answer: the vendor that has listings, oldest first.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';

export interface MyVendor {
  id: string;
  business_name: string | null;
  slug: string;
}

interface OwnedVendor {
  id: string;
  business_name: string | null;
  listings: { id: string }[] | null;
}

/**
 * The vendors an account owns, split into the ones that have a listing and the
 * empty ones. An empty vendor row is what an interrupted sign-up leaves behind
 * (the vendor row is written before the listing). It is not a business the
 * account "already manages", and must never block that account from claiming
 * its real profile.
 *
 * `failed` is true when the rows could not be read. A caller that is about to
 * hand over a profile must stop on it: "could not tell" is not "owns nothing".
 */
export async function ownedVendors(
  supabase: SupabaseClient<any, any, any>,
  profileId: string
): Promise<{ real: OwnedVendor[]; empty: OwnedVendor[]; failed: boolean }> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, listings(id)')
    .eq('user_id', profileId);
  const rows = (data as OwnedVendor[] | null) ?? [];
  return {
    real: rows.filter((v) => (v.listings?.length ?? 0) > 0),
    empty: rows.filter((v) => (v.listings?.length ?? 0) === 0),
    failed: Boolean(error),
  };
}

// Everything that hangs off a vendor row and is deleted with it (ON DELETE
// CASCADE): table, and the column that points at the vendor.
const VENDOR_DEPENDENTS = [
  ['listings', 'vendor_id'],
  ['subscriptions', 'vendor_id'],
  ['messages', 'to_vendor_id'],
  ['vendor_private_contacts', 'vendor_id'],
] as const;

/**
 * Remove the empty vendor rows an interrupted sign-up left on an account, once
 * that account has a real profile. Deleting a vendor deletes its listings, its
 * subscription records and its messages with it, so this never trusts the
 * caller's view of "empty": it looks again with the service role (which no
 * row-level rule can hide a row from) and only deletes when it is certain
 * there is nothing at all under those rows. A subscription record matters
 * most: lose it and Stripe keeps charging for something the site no longer
 * knows about.
 */
export async function deleteEmptyVendorRows(profileId: string, vendorIds: string[]): Promise<void> {
  if (vendorIds.length === 0) return;
  try {
    const admin = await createAdminClient();
    const counts = await Promise.all(
      VENDOR_DEPENDENTS.map(([table, column]) =>
        admin.from(table).select(column, { count: 'exact', head: true }).in(column, vendorIds)
      )
    );
    if (counts.some((c) => c.error || c.count !== 0)) return;
    await admin.from('vendors').delete().in('id', vendorIds).eq('user_id', profileId);
  } catch (err) {
    console.error('[my-vendor] clearing empty vendor rows failed', err);
  }
}

export async function getMyVendor(
  supabase: SupabaseClient<any, any, any>,
  profileId: string
): Promise<MyVendor | null> {
  const { data } = await supabase
    .from('vendors')
    .select('id, business_name, slug, created_at, listings(id)')
    .eq('user_id', profileId)
    .order('created_at', { ascending: true });

  const rows = (data as Array<MyVendor & { listings: { id: string }[] | null }> | null) ?? [];
  if (rows.length === 0) return null;
  const chosen = rows.find((v) => (v.listings?.length ?? 0) > 0) ?? rows[0];
  return { id: chosen.id, business_name: chosen.business_name, slug: chosen.slug };
}
