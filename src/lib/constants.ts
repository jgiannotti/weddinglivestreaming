// Shared, tiny constants used across public-facing pages/components.

// Used whenever a listing has no hero_image_url set (nullable column in Supabase)
// so <Image> never receives null/undefined as a src.
export const PLACEHOLDER_LISTING_IMAGE =
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80';
