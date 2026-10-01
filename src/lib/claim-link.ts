// Signed "claim your profile" links (server-only).
//
// The problem this solves: the lead-teaser email tells an unclaimed vendor
// "claim your profile to see the inquiry", and then the claim sat in a manual
// review queue for up to a business day while the couple's request went cold.
//
// A link we emailed to the business's own published address is itself proof of
// ownership: whoever can open that inbox controls the business's public
// contact point. So those emails now carry a signed token, and a claim that
// presents a valid token is approved on the spot (see /api/claims/instant).
// Claims that arrive without one still go to manual review, unchanged.
//
// Token = `<expiry, base36 seconds>.<HMAC-SHA256(vendorId + "." + expiry)>`.
// The vendor id is NOT inside the token. It comes from the listing the claim
// page is for, so a token minted for one vendor can never open another.
//
// No new environment variable is required: the key is derived from the
// service-role key (the same fallback the pageview salt uses). Set
// CLAIM_LINK_SECRET to rotate independently. Rotating either one simply
// invalidates outstanding links, which then fall back to manual review.

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * How long an emailed claim link stays instant. After that: manual review.
 *
 * The link is a key to the profile and to the couples waiting on it, and it
 * travels in an email that can be forwarded. Two weeks covers a vendor who
 * reads the message late; an older link simply sends the claim through the
 * normal review, and the next lead email carries a fresh one.
 */
export const CLAIM_LINK_TTL_DAYS = 14;

function signingKey(): string | null {
  const base = process.env.CLAIM_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return base ? `claim-link:v1:${base}` : null;
}

function sign(key: string, vendorId: string, expiresAtSec: number): Buffer {
  return createHmac('sha256', key).update(`${vendorId}.${expiresAtSec}`).digest();
}

/** Mint a token for one vendor. Returns null if no signing key is configured. */
export function signClaimToken(vendorId: string, nowMs: number = Date.now()): string | null {
  const key = signingKey();
  if (!key || !vendorId) return null;
  const expiresAtSec = Math.floor(nowMs / 1000) + CLAIM_LINK_TTL_DAYS * 24 * 60 * 60;
  return `${expiresAtSec.toString(36)}.${sign(key, vendorId, expiresAtSec).toString('base64url')}`;
}

/** True only for an unexpired token that was minted for exactly this vendor. */
export function verifyClaimToken(
  token: string | null | undefined,
  vendorId: string,
  nowMs: number = Date.now()
): boolean {
  const key = signingKey();
  if (!key || !token || !vendorId || token.length > 200) return false;

  const dot = token.indexOf('.');
  if (dot <= 0) return false;

  const expiresAtSec = parseInt(token.slice(0, dot), 36);
  if (!Number.isFinite(expiresAtSec) || expiresAtSec * 1000 < nowMs) return false;

  let presented: Buffer;
  try {
    presented = Buffer.from(token.slice(dot + 1), 'base64url');
  } catch {
    return false;
  }
  const expected = sign(key, vendorId, expiresAtSec);
  if (presented.length !== expected.length) return false;
  return timingSafeEqual(presented, expected);
}

/** Full claim URL for an email. Falls back to the plain claim page if unsigned. */
export function claimUrlFor(opts: {
  site: string;
  slug: string;
  vendorId: string;
  utmSource?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.utmSource) params.set('utm_source', opts.utmSource);
  const token = signClaimToken(opts.vendorId);
  if (token) params.set('t', token);
  const qs = params.toString();
  return `${opts.site}/claim/${opts.slug}${qs ? `?${qs}` : ''}`;
}
