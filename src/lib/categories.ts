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
