// Signed opt-out links for the emails we send to unclaimed vendors
// (server-only).
//
// The opt-out link used to be the bare vendor id, and opening it was enough to
// opt the vendor out. Two problems:
//
//   1. Mail security gateways open every link in a message before a person
//      sees it. One scan and the vendor was opted out of lead emails for good,
//      without ever knowing a couple had asked for them.
//   2. Vendor ids are public (they are in every listing the site serves), so
//      anyone could switch off lead emails for any vendor.
//
// Now the link carries a signature, opening it only shows a confirmation
// page, and the opt-out happens on the POST that page (or a mail client's
// one-click unsubscribe) sends. See /api/lead-notify/unsubscribe.
//
// No expiry: an unsubscribe link has to keep working for as long as the email
// exists. For the same reason it does not share a secret with the claim links:
// CLAIM_LINK_SECRET is the thing to rotate when a claim link has to be killed,
// and rotating it must not quietly break every opt-out link already sitting in
// an inbox.
//
// Set UNSUBSCRIBE_SECRET to give these their own key; otherwise the
// service-role key is used. Links are signed with the first of the two that
// is set and accepted if either one made them, so setting UNSUBSCRIBE_SECRET
// later does not break links that are already out. Rotating the service-role
// key with no UNSUBSCRIBE_SECRET set does break them (the page then tells the
// vendor to opt out by email instead), which is the reason to set one.

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Emails sent before links were signed carry the bare vendor id. Those keep
 * working until this date (an opt-out link has to outlive the email it is in),
 * and only for vendors last emailed around the release that introduced signing
 * or before it (see src/lib/release.ts). After it, an unsigned link gets a page saying how
 * to opt out by email instead.
 */
export const UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL = Date.UTC(2026, 11, 31); // 31 Dec 2026

/** The keys a link may have been signed with. The one to sign with comes first. */
function signingKeys(): string[] {
  return [process.env.UNSUBSCRIBE_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY]
    .filter((base): base is string => Boolean(base))
    .map((base) => `lead-unsubscribe:v1:${base}`);
}

function signWith(key: string, vendorId: string): string {
  return createHmac('sha256', key).update(vendorId).digest('base64url');
}

export function signUnsubscribe(vendorId: string): string | null {
  const [key] = signingKeys();
  if (!key || !vendorId) return null;
  return signWith(key, vendorId);
}

export function verifyUnsubscribe(signature: string | null | undefined, vendorId: string): boolean {
  if (!signature || signature.length > 100 || !vendorId) return false;
  const given = Buffer.from(signature);
  return signingKeys().some((key) => {
    const expected = Buffer.from(signWith(key, vendorId));
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** Opt-out URL for an email footer and for the List-Unsubscribe header. */
export function unsubscribeUrlFor(site: string, vendorId: string): string {
  const s = signUnsubscribe(vendorId);
  return `${site}/api/lead-notify/unsubscribe?v=${vendorId}${s ? `&s=${s}` : ''}`;
}
