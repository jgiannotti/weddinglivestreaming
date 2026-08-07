import type { MetadataRoute } from 'next';
import { US_STATES, getStateByName } from '@/lib/states';
import { getListings, getCitiesWithListings } from '@/lib/data/listings';
import { slugify } from '@/lib/utils';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
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
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
  }));

  const guidePages = [
    '/guides',
    '/guides/wedding-live-streaming-cost',
    '/guides/wedding-live-streaming-cost-by-state',
    '/guides/how-to-live-stream-a-wedding',
    '/guides/diy-vs-professional-wedding-livestream',
    '/guides/questions-to-ask-your-wedding-livestreamer',
    '/guides/zoom-vs-youtube-vs-professional-wedding-livestream',
    '/guides/how-to-livestream-a-church-wedding',
    '/guides/wedding-livestream-invitation-wording',
    '/guides/how-to-watch-a-wedding-livestream',
    '/guides/how-to-start-a-wedding-livestreaming-business',
    '/guides/is-a-wedding-livestream-worth-it',
    '/guides/wedding-livestream-equipment',
    '/guides/how-to-livestream-an-outdoor-wedding',
    '/guides/should-you-livestream-your-wedding-reception',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const statePages = US_STATES.map((state) => ({
    url: `${BASE}/wedding-live-streaming-${state.slug}`,
    lastModified: now,
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
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return [...staticPages, ...guidePages, ...statePages, ...cityPages, ...listingPages];
}
