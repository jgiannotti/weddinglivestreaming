import type { MetadataRoute } from 'next';
import { US_STATES } from '@/lib/states';
import { getListings } from '@/lib/data/listings';

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
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
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

  return [...staticPages, ...statePages, ...listingPages];
}
