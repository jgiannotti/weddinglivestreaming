import type { Category } from './types';

// Seeded from the existing HivePress categories.
export const CATEGORIES: Category[] = [
  { id: 'cat-budget',      name: 'Budget-Friendly',           slug: 'budget-friendly',           sortOrder: 1 },
  { id: 'cat-church',      name: 'Church & Religious Ceremonies', slug: 'church-religious',     sortOrder: 2 },
  { id: 'cat-destination', name: 'Destination Weddings',       slug: 'destination-weddings',     sortOrder: 3 },
  { id: 'cat-fullservice', name: 'Full-Service Production',    slug: 'full-service-production', sortOrder: 4 },
  { id: 'cat-cinematic',   name: 'Multi-Camera & Cinematic',   slug: 'multi-camera-cinematic',  sortOrder: 5 },
  { id: 'cat-solo',        name: 'Solo Operator',              slug: 'solo-operator',            sortOrder: 6 },
];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

// Milestone 2 — sensible starting service_radius_miles by category, used to
// pre-fill (not lock) the radius slider on listing create/edit. Destination
// Weddings vendors default to nationwide instead of a radius number, since
// that's the whole point of the category.
export const CATEGORY_DEFAULT_RADIUS_MILES: Record<string, number> = {
  'solo-operator': 40,
  'budget-friendly': 40,
  'full-service-production': 100,
  'multi-camera-cinematic': 100,
  'church-religious': 60,
  'destination-weddings': 60, // paired with travelsNationwide defaulting true below
};

export const NATIONWIDE_DEFAULT_CATEGORY_SLUGS = new Set(['destination-weddings']);

/** Best-effort default radius/nationwide suggestion from a set of selected category slugs. */
export function suggestRadiusDefaults(categorySlugs: string[]): { radiusMiles: number; nationwide: boolean } {
  if (categorySlugs.some((slug) => NATIONWIDE_DEFAULT_CATEGORY_SLUGS.has(slug))) {
    return { radiusMiles: 60, nationwide: true };
  }
  const radii = categorySlugs
    .map((slug) => CATEGORY_DEFAULT_RADIUS_MILES[slug])
    .filter((n): n is number => typeof n === 'number');
  if (radii.length === 0) return { radiusMiles: 60, nationwide: false };
  return { radiusMiles: Math.max(...radii), nationwide: false };
}
