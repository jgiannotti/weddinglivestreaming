import type { MetadataRoute } from 'next';
import { US_STATES } from '@/lib/states';
import { CATEGORIES } from '@/lib/categories';
import { MOCK_LISTINGS } from '@/data/mock-listings';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO: when Supabase is connected, swap MOCK_LISTINGS for a live query
  const now = new Date();

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

  const listingPages = MOCK_LISTINGS.map((l) => ({
    url: `${BASE}/listing/${l.slug}`,
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statePages, ...listingPages];
}
