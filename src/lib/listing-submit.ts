// Pure helpers for the listing forms. Kept free of React and Supabase so they
// can be unit-tested directly (scripts/test-vendor-funnel.mjs).

import { slugify } from '@/lib/utils';

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/**
 * The only file types a cover photo may be. The file picker already filters to
 * these, but a picker filter is a suggestion: anything can be dragged in or
 * chosen with "All files". (The storage bucket should enforce the same list;
 * this check is the part that can give the vendor a clear message.)
 */
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** A message when the chosen photo cannot be used, or null when it is fine. */
export function photoProblem(file: { size: number; type: string } | null | undefined): string | null {
  if (!file) return null;
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WebP image for your cover photo.';
  if (file.size > MAX_PHOTO_BYTES) return 'That photo is larger than 15 MB. Please choose a smaller one.';
  return null;
}

/**
 * A storage-safe file name for an uploaded photo.
 *
 * Supabase Storage rejects keys containing characters outside a narrow safe
 * set, and real photo names are full of them: macOS screenshots carry a
 * narrow no-break space before "PM", phones add parentheses and accents.
 * Passing the raw name through used to fail the whole submission with an
 * "Invalid key" error the vendor could do nothing about.
 */
export function safeUploadName(name: string): string {
  const dot = name.lastIndexOf('.');
  const rawStem = dot > 0 ? name.slice(0, dot) : name;
  const rawExt = dot > 0 ? name.slice(dot + 1) : '';

  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
  const stem =
    rawStem
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'photo';

  return ext ? `${stem}.${ext}` : stem;
}

/**
 * Slugs to try, in order, for a new vendor and listing. Both tables have a
 * unique slug, and the plain name is often already taken by a seeded profile
 * of a different business with the same name, so fall back to city, then
 * city + state, then a short random suffix that cannot collide in practice.
 */
export function slugCandidates(businessName: string, city: string, state: string): string[] {
  const base = slugify(businessName) || 'vendor';
  const citySlug = slugify(city);
  const stateSlug = slugify(state);
  const random = Math.random().toString(36).slice(2, 7) || 'x1';

  const out = [base];
  if (citySlug) out.push(`${base}-${citySlug}`);
  if (citySlug && stateSlug) out.push(`${base}-${citySlug}-${stateSlug}`);
  out.push(`${base}-${random}`);
  return [...new Set(out)];
}

/**
 * Turn a database or network failure into something a vendor can act on.
 * The raw message ("duplicate key value violates unique constraint
 * vendors_slug_key") used to be shown as-is.
 */
export function friendlySubmitError(err: unknown): string {
  const e = (err ?? {}) as { code?: string; message?: string; statusCode?: string | number };
  const message = String(e.message ?? '');

  if (e.code === '23505') {
    return 'A listing with that name already exists. If it is your business, search for it on the Claim page and claim it instead of creating a new one.';
  }
  if (e.code === '42501' || /row-level security|jwt|not authorized|permission denied/i.test(message)) {
    return 'Your sign-in expired. Refresh this page, sign in again, and resubmit.';
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'We could not save your listing. Please try again in a minute. If it keeps happening, email hello@weddinglivestreaming.com and we will set it up for you.';
}
