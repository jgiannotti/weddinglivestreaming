import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { getStateBySlug, US_STATES } from '@/lib/states';
import { getListings } from '@/lib/data/listings';

interface PageProps {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const info = getStateBySlug(state);
  if (!info) return { title: 'State Not Found' };
  return {
    title: `Wedding Live Streaming in ${info.name}`,
    description: `Find and connect with professional wedding live streaming vendors serving couples across ${info.name}.`,
  };
}

export default async function StatePage({ params }: PageProps) {
  const { state } = await params;
  const info = getStateBySlug(state);
  if (!info) notFound();

  const listings = await getListings({ state: info.name, limit: 9 });

  return (
    <div>
      {/* HERO */}
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">Directory</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
              Wedding Live Streaming<br />in {info.name}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Find and connect with professional wedding live streaming vendors serving couples across {info.name}.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <span><span className="font-semibold text-foreground">{listings.length}+</span> Vendors</span>
              <span><span className="font-semibold text-foreground">Free</span> To Contact</span>
              <span><span className="font-semibold text-foreground">Direct</span> Messaging</span>
            </div>
            <Button asChild className="mt-8">
              <Link href={`/directory?location=${encodeURIComponent(info.name)}`}>
                Search {info.name} Vendors
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* VENDORS */}
      <section className="container py-16">
        <div className="mb-10">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">{info.name} Directory</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">
            Live Streaming Vendors in {info.name}
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground mb-6">
              We don&rsquo;t have vendors listed in {info.name} yet — but we&rsquo;re growing fast.
            </p>
            <Button asChild>
              <Link href="/submit-listing">Are you a {info.name} vendor? List your business →</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* BROWSE BY CITY */}
      {info.topCities.length > 0 && (
        <section className="container py-16 border-t">
          <h2 className="font-display text-3xl font-medium mb-2">Find Vendors in Your City</h2>
          <p className="text-muted-foreground mb-8">Browse {info.name} vendors by city</p>
          <div className="flex flex-wrap gap-2">
            {info.topCities.map((city) => (
              <Link
                key={city}
                href={`/directory?location=${encodeURIComponent(city)}`}
                className="px-4 py-2 rounded-full border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
            Are You a {info.name} Vendor?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Add your business to the directory and connect with couples planning their weddings across {info.name}.
          </p>
          <Button asChild size="lg">
            <Link href="/submit-listing">List Your Business Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
