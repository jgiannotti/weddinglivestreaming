// Mock data used when Supabase is not yet configured.
// Populated from the live site so the app is immediately demoable.
// Once migration runs, this is replaced by real DB queries.

import type { Listing, Vendor } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';

export const MOCK_VENDORS: Vendor[] = [
  { id: 'v-1', userId: 'u-1', businessName: 'WedStream NY',              slug: 'wedstream-ny',              bio: null, websiteUrl: 'https://wedstreamny.com', phone: null, memberSince: '2026-02-11' },
  { id: 'v-2', userId: 'u-2', businessName: 'Ward Video and Photo Booth', slug: 'ward-video-and-photo-booth', bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-3', userId: 'u-3', businessName: 'Evergreen Creative Company', slug: 'evergreen-creative-company', bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-4', userId: 'u-4', businessName: 'Matt Kendall Productions',   slug: 'matt-kendall-productions',   bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-5', userId: 'u-5', businessName: 'Down In Front Productions',  slug: 'down-in-front-productions',  bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-6', userId: 'u-6', businessName: 'GoLive Alaska',              slug: 'golive-alaska',              bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-7', userId: 'u-7', businessName: 'Studio Vieux Carré',         slug: 'studio-vieux-carre',         bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-8', userId: 'u-8', businessName: 'Calfee Productions',         slug: 'calfee-productions',         bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-9', userId: 'u-9', businessName: 'Montoto Productions',        slug: 'montoto-productions',        bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
  { id: 'v-10', userId: 'u-10', businessName: 'Your Day Production',      slug: 'your-day-production',        bio: null, websiteUrl: null,                      phone: null, memberSince: '2026-02-11' },
];

// Placeholder image references match the structure we'll get from the WP migration.
// During development they fall back to a tasteful Unsplash placeholder via next.config remotePatterns.
const placeholder = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=800&h=600&fit=crop&q=80`;

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l-1',
    vendorId: 'v-1',
    title: 'WedStream NY',
    slug: 'wedstream-ny',
    description:
      'A NYC wedding live stream company (est. 2021) with years of live production experience. WedStreamNY uses broadcast-quality equipment to stream your ceremony in real time. They specialize in making remote guests feel like they\'re part of the celebration through multi-angle coverage and professional production, handling events in New York and beyond.',
    heroImageUrl: placeholder('1519741497674-611481863552'),
    city: 'New York City',
    state: 'New York',
    country: 'United States',
    lat: 40.712749,
    lng: -74.005994,
    status: 'approved',
    tier: 'featured',
    featuredUntil: '2027-02-11',
    websiteUrl: 'https://wedstreamny.com',
    categories: [CATEGORIES[3], CATEGORIES[4]],
    viewCount: 234,
    inquiryCount: 12,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[0],
  },
  {
    id: 'l-2',
    vendorId: 'v-2',
    title: 'Ward Video and Photo Booth',
    slug: 'ward-video-and-photo-booth',
    description: 'Oklahoma City\'s trusted source for wedding live streaming and photo booth services. We bring distant family right into your ceremony with professional, broadcast-quality streaming.',
    heroImageUrl: placeholder('1606216794074-735e91aa2c92'),
    city: 'Oklahoma City',
    state: 'Oklahoma',
    country: 'United States',
    lat: 35.46883,
    lng: -97.517981,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[3]],
    viewCount: 89,
    inquiryCount: 4,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[1],
  },
  {
    id: 'l-3',
    vendorId: 'v-3',
    title: 'Evergreen Creative Company',
    slug: 'evergreen-creative-company',
    description: 'Boutique wedding cinematography and live streaming based in Dothan. Specializing in intimate, story-driven coverage that captures the heart of your day.',
    heroImageUrl: placeholder('1591604466107-ec97de577aff'),
    city: 'Dothan',
    state: 'Alabama',
    country: 'United States',
    lat: 31.225183,
    lng: -85.393578,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[4]],
    viewCount: 56,
    inquiryCount: 2,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[2],
  },
  {
    id: 'l-4',
    vendorId: 'v-4',
    title: 'Matt Kendall Productions',
    slug: 'matt-kendall-productions',
    description: 'Birmingham-based multi-camera production team bringing your wedding to remote loved ones with cinematic quality and reliable, redundant streaming.',
    heroImageUrl: placeholder('1519225421980-715cb0215aed'),
    city: 'Birmingham',
    state: 'Alabama',
    country: 'United States',
    lat: 33.522217,
    lng: -86.809079,
    status: 'approved',
    tier: 'featured',
    featuredUntil: '2027-02-11',
    websiteUrl: null,
    categories: [CATEGORIES[3], CATEGORIES[4]],
    viewCount: 178,
    inquiryCount: 9,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[3],
  },
  {
    id: 'l-5',
    vendorId: 'v-5',
    title: 'Down In Front Productions',
    slug: 'down-in-front-productions',
    description: 'Affordable, professional livestreaming for Birmingham-area weddings. We make sure every guest — near and far — has a great seat.',
    heroImageUrl: placeholder('1511795409834-ef04bbd61622'),
    city: 'Birmingham',
    state: 'Alabama',
    country: 'United States',
    lat: 33.522217,
    lng: -86.809079,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[0], CATEGORIES[5]],
    viewCount: 42,
    inquiryCount: 1,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[4],
  },
  {
    id: 'l-6',
    vendorId: 'v-6',
    title: 'GoLive Alaska',
    slug: 'golive-alaska',
    description: 'Alaska\'s premier wedding livestream service. Whether it\'s a glacier ceremony or a downtown Anchorage venue, we bring your wedding to the world in HD.',
    heroImageUrl: placeholder('1465495976277-4387d4b0e4a6'),
    city: 'Anchorage',
    state: 'Alaska',
    country: 'United States',
    lat: 61.216563,
    lng: -149.893442,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[2], CATEGORIES[3]],
    viewCount: 67,
    inquiryCount: 3,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[5],
  },
  {
    id: 'l-7',
    vendorId: 'v-7',
    title: 'Studio Vieux Carré',
    slug: 'studio-vieux-carre',
    description: 'New Orleans\' boutique wedding livestream studio. Cinematic multi-camera coverage of ceremonies in the French Quarter and beyond, with audio that matches the visuals.',
    heroImageUrl: placeholder('1525772764200-be829a350797'),
    city: 'New Orleans',
    state: 'Louisiana',
    country: 'United States',
    lat: 29.975962,
    lng: -90.078202,
    status: 'approved',
    tier: 'featured',
    featuredUntil: '2027-02-11',
    websiteUrl: null,
    categories: [CATEGORIES[3], CATEGORIES[4]],
    viewCount: 145,
    inquiryCount: 8,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[6],
  },
  {
    id: 'l-8',
    vendorId: 'v-8',
    title: 'Calfee Productions',
    slug: 'calfee-productions',
    description: 'New Orleans wedding videography and livestreaming with a documentary eye. Discreet, professional, and obsessed with audio quality.',
    heroImageUrl: placeholder('1606800052052-a08af7148866'),
    city: 'New Orleans',
    state: 'Louisiana',
    country: 'United States',
    lat: 29.975962,
    lng: -90.078202,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[4], CATEGORIES[5]],
    viewCount: 91,
    inquiryCount: 5,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[7],
  },
  {
    id: 'l-9',
    vendorId: 'v-9',
    title: 'Montoto Productions',
    slug: 'montoto-productions',
    description: 'Lafayette\'s go-to for bilingual wedding livestreams — perfect for Cajun country celebrations with family watching from out of state and abroad.',
    heroImageUrl: placeholder('1519741497674-611481863552'),
    city: 'Lafayette',
    state: 'Louisiana',
    country: 'United States',
    lat: 30.222907,
    lng: -92.018777,
    status: 'approved',
    tier: 'basic',
    featuredUntil: null,
    websiteUrl: null,
    categories: [CATEGORIES[5]],
    viewCount: 38,
    inquiryCount: 1,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[8],
  },
  {
    id: 'l-10',
    vendorId: 'v-10',
    title: 'Your Day Production',
    slug: 'your-day-production',
    description: 'New Orleans full-service wedding production: livestreaming, photo, video, and audio. One team, one workflow, one beautiful keepsake.',
    heroImageUrl: placeholder('1606216794074-735e91aa2c92'),
    city: 'New Orleans',
    state: 'Louisiana',
    country: 'United States',
    lat: 29.951065,
    lng: -90.071533,
    status: 'approved',
    tier: 'featured',
    featuredUntil: '2027-02-11',
    websiteUrl: null,
    categories: [CATEGORIES[3]],
    viewCount: 201,
    inquiryCount: 11,
    createdAt: '2026-02-11',
    updatedAt: '2026-02-11',
    expiresAt: '2027-02-11',
    vendor: MOCK_VENDORS[9],
  },
];

// Helpers used by pages until Supabase queries replace them.
export function getListings(opts: {
  state?: string;
  category?: string;
  search?: string;
  limit?: number;
  sortBy?: 'date' | 'title';
} = {}): Listing[] {
  let results = [...MOCK_LISTINGS];
  if (opts.state) {
    const s = opts.state.toLowerCase();
    results = results.filter((l) => l.state.toLowerCase() === s);
  }
  if (opts.category) {
    results = results.filter((l) =>
      l.categories.some((c) => c.slug === opts.category)
    );
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }
  // Featured listings always rank above basic, then by sort.
  results.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'featured' ? -1 : 1;
    if (opts.sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  if (opts.limit) results = results.slice(0, opts.limit);
  return results;
}

export function getFeaturedListings(limit = 6): Listing[] {
  return MOCK_LISTINGS.filter((l) => l.tier === 'featured').slice(0, limit);
}

export function getListingBySlug(slug: string): Listing | null {
  return MOCK_LISTINGS.find((l) => l.slug === slug) ?? null;
}

export function getVendorBySlug(slug: string): Vendor | null {
  return MOCK_VENDORS.find((v) => v.slug === slug) ?? null;
}

export function getListingsByVendor(vendorId: string): Listing[] {
  return MOCK_LISTINGS.filter((l) => l.vendorId === vendorId);
}

export function getRelatedListings(listing: Listing, limit = 3): Listing[] {
  return MOCK_LISTINGS
    .filter((l) => l.id !== listing.id)
    .filter((l) =>
      l.categories.some((c) => listing.categories.some((lc) => lc.id === c.id))
    )
    .slice(0, limit);
}
