// Shared, tiny constants used across public-facing pages/components.

// Fallback hero images for listings with no hero_image_url (nullable column in
// Supabase). A pool — not a single image — so a page of seeded listings doesn't
// show the same photo on every card, which read as fake/templated. All are
// stable Unsplash CDN URLs (verified 200s at time of adding).
export const PLACEHOLDER_LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=600&fit=crop&q=80',
];

// Deterministic pick so a given listing always shows the same placeholder
// (no hydration mismatch, stable across page loads). Seed with listing.id.
export function getPlaceholderImage(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_LISTING_IMAGES[h % PLACEHOLDER_LISTING_IMAGES.length];
}

// Back-compat single fallback (used where no per-listing seed is available).
export const PLACEHOLDER_LISTING_IMAGE = PLACEHOLDER_LISTING_IMAGES[0];
