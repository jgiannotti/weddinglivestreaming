import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, BadgeCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getListings } from '@/lib/data/listings';

export const metadata: Metadata = {
  title: 'Claim Your Listing',
  description:
    'Already listed on WeddingLiveStreaming.com? Find your business and claim your free profile to manage photos, coverage area, and couple inquiries.',
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClaimIndexPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim().slice(0, 80);
  const results = query ? await getListings({ search: query, limit: 12 }) : [];

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <div className="text-center mb-10">
        <p className="eyebrow mb-3">For listed vendors</p>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Claim your listing</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          We may have already listed your business in our directory. Find it below and claim it
          for free — you&rsquo;ll get a verified badge, direct couple inquiries, and full control
          of your profile.
        </p>
      </div>

      <form action="/claim" method="get" className="flex gap-2 mb-8" role="search">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search your business name…"
            autoComplete="off"
            className="w-full h-12 rounded-full border bg-card pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Button type="submit" size="lg" className="shrink-0">Search</Button>
      </form>

      {query && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <div className="text-center rounded-3xl border bg-card p-8">
              <p className="font-semibold mb-1">No listings found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-muted-foreground mb-5">
                Not in the directory yet? Creating a listing takes about five minutes and is free.
              </p>
              <Button asChild>
                <Link href="/submit-listing">List Your Business</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((l) => {
                const claimed = Boolean(l.vendor?.userId);
                return (
                  <li key={l.id}>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{l.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {l.city}, {l.state}
                        </p>
                      </div>
                      {claimed ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                          <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                          Already claimed
                        </span>
                      ) : (
                        <Button asChild size="sm" className="shrink-0">
                          <Link href={`/claim/${l.slug}`}>
                            Claim this listing
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {!query && (
        <p className="text-center text-sm text-muted-foreground">
          Can&rsquo;t find your business after searching?{' '}
          <Link href="/submit-listing" className="text-primary hover:underline">
            Create a new listing
          </Link>{' '}
          instead — it&rsquo;s free.
        </p>
      )}
    </div>
  );
}
