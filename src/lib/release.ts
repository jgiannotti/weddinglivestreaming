// The day this release went live in production, UTC, as YYYY-MM-DD.
//
// Two things changed on that day that older data cannot tell apart:
//
//   1. The page-view counter stopped storing link prefetches as views. Rows
//      from before (and from the release day itself, before the deploy) are
//      inflated, so the vendor dashboard starts counting the day after.
//   2. Unsubscribe links became signed. Emails sent before the release carry
//      an unsigned link, which is honoured for a while; emails sent after it
//      never do.
//
// SET THIS TO THE REAL DEPLOY DATE IN THE SAME PUSH. A date later than the real
// one only delays the dashboard numbers by a day or two. A date earlier than
// the real one lets inflated days into what vendors are shown. (The opt-out
// rule has a week of slack built in, below, so a deploy that slips a few days
// never leaves a vendor holding a link that will not opt them out.)
export const RELEASE_DATE = '2026-10-01';

const DAY_MS = 24 * 60 * 60 * 1000;

/** First full day after the release, as YYYY-MM-DD. */
export function dayAfterRelease(): string {
  return new Date(Date.parse(`${RELEASE_DATE}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
}

/** The instant the release day ended (UTC), in ms. */
export function endOfReleaseDayMs(): number {
  return Date.parse(`${RELEASE_DATE}T00:00:00Z`) + DAY_MS;
}

/**
 * A vendor last emailed before this instant may be holding an unsigned opt-out
 * link. A week past the release day on purpose: if the deploy happens a few
 * days after RELEASE_DATE says, vendors emailed by the old code in between are
 * still covered. Erring late only keeps an old link working a little longer;
 * erring early would leave someone with a link that refuses to opt them out.
 */
export function unsignedLinksSentBeforeMs(): number {
  return endOfReleaseDayMs() + 7 * DAY_MS;
}
