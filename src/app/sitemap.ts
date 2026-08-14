import type { MetadataRoute } from 'next';
import { US_STATES, getStateByName } from '@/lib/states';
import { getListings, getCitiesWithListings } from '@/lib/data/listings';
import { slugify } from '@/lib/utils';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com';

// lastModified policy: only claim a date we can actually stand behind.
// Stamping `new Date()` on every URL each build teaches crawlers the field is
// noise (Google detects always-changing lastmod and ignores it). So: guides
// carry their real last-edit date (update when a guide meaningfully changes),
// listings use their DB updatedAt, and pages whose content shifts with the
// directory (home, state, city) omit lastModified rather than lie.
const GUIDE_DATES: Record<string, string> = {
  '/guides': '2026-08-07',
  '/guides/wedding-live-streaming-cost': '2026-08-07',
  '/guides/wedding-live-streaming-cost-by-state': '2026-08-07',
  '/guides/how-to-live-stream-a-wedding': '2026-07-11',
  '/guides/diy-vs-professional-wedding-livestream': '2026-07-11',
  '/guides/questions-to-ask-your-wedding-livestreamer': '2026-07-11',
  '/guides/zoom-vs-youtube-vs-professional-wedding-livestream': '2026-07-11',
  '/guides/how-to-livestream-a-church-wedding': '2026-08-07',
  '/guides/wedding-livestream-invitation-wording': '2026-08-07',
  '/guides/how-to-watch-a-wedding-livestream': '2026-08-07',
  '/guides/how-to-start-a-wedding-livestreaming-business': '2026-08-07',
  '/guides/is-a-wedding-livestream-worth-it': '2026-08-07',
  '/guides/wedding-livestream-equipment': '2026-08-07',
  '/guides/how-to-livestream-an-outdoor-wedding': '2026-08-07',
  '/guides/should-you-livestream-your-wedding-reception': '2026-08-07',
  '/guides/wedding-livestream-music-copyright': '2026-08-07',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();

  const staticPages = [
    '/',
    '/directory',
    '/how-it-works',
    '/for-vendors',
    '/pricing',
    '/about',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/submit-listing',
    '/vendor-badge',
    '/press',
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
  }));

  const guidePages = Object.entries(GUIDE_DATES).map(([path, date]) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const statePages = US_STATES.map((state) => ({
    url: `${BASE}/wedding-live-streaming-${state.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const listingPages = listings.map((l) => ({
    url: `${BASE}/listing/${l.slug}`,
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Programmatic city pages — only for (state, city) pairs with a real
  // approved listing, so we never submit a thin/empty page to Google.
  const cityPairs = await getCitiesWithListings();
  const cityPages = cityPairs
    .map(({ state, city }) => {
      const stateInfo = getStateByName(state);
      if (!stateInfo) return null;
      return {
        url: `${BASE}/wedding-live-streaming-${stateInfo.slug}/${slugify(city)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return [...staticPages, ...guidePages, ...statePages, ...cityPages, ...listingPages];
}
