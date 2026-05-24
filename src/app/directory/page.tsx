import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { getListings } from '@/data/mock-listings';
import { CATEGORIES } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Find Vendors',
  description: 'Browse 100+ professional wedding live streaming vendors across the United States.',
};

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    location?: string;
    category?: string;
    sort?: 'date' | 'title';
    page?: string;
  }>;
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const all = getListings({
    state: params.location,
    category: params.category,
    sortBy: params.sort || 'date',
  });

  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const listings = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-8">
        <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">Directory</p>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {params.location ? `Vendors in ${params.location}` : 'Find Vendors'}
        </h1>
        <p className="text-muted-foreground">
          {all.length} {all.length === 1 ? 'vendor' : 'vendors'} found
        </p>
      </div>

      <div className="mb-8">
        <Suspense>
          <SearchBar variant="compact" defaultLocation={params.location} defaultCategory={params.category} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar filters */}
        <aside className="space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={`/directory${params.location ? `?location=${encodeURIComponent(params.location)}` : ''}`}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    !params.category ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted'
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {CATEGORIES.map((cat) => {
                const qs = new URLSearchParams();
                if (params.location) qs.set('location', params.location);
                qs.set('category', cat.slug);
                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory?${qs.toString()}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        params.category === cat.slug ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Sort</h3>
            <ul className="space-y-1">
              {[
                { key: 'date',  label: 'Newest first' },
                { key: 'title', label: 'Name (A–Z)' },
              ].map((opt) => {
                const qs = new URLSearchParams();
                if (params.location) qs.set('location', params.location);
                if (params.category) qs.set('category', params.category);
                qs.set('sort', opt.key);
                return (
                  <li key={opt.key}>
                    <Link
                      href={`/directory?${qs.toString()}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        (params.sort || 'date') === opt.key ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground mb-4">No vendors match your search.</p>
              <Button asChild variant="outline">
                <Link href="/directory">Clear filters</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(params, page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Link>
                    </Button>
                  )}
                  <span className="px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(params, page + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageUrl(params: { location?: string; category?: string; sort?: string }, page: number) {
  const qs = new URLSearchParams();
  if (params.location) qs.set('location', params.location);
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  qs.set('page', String(page));
  return `/directory?${qs.toString()}`;
}
