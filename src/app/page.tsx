import Link from 'next/link';
import { ArrowRight, Sparkles, MessageSquare, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { ListingCard } from '@/components/listing-card';
import { getFeaturedListings, getListingStats } from '@/lib/data/listings';
import { US_STATES } from '@/lib/states';

const POPULAR_STATES = ['california', 'texas', 'florida', 'new-york', 'georgia', 'pennsylvania', 'illinois', 'ohio', 'north-carolina', 'michigan', 'arizona', 'massachusetts', 'washington', 'colorado', 'virginia', 'tennessee'];

export default async function HomePage() {
  const featured = await getFeaturedListings(8);
  const stats = await getListingStats();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/40 via-background to-background">
        <div className="container py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-medium tracking-wider uppercase text-primary mb-4">
              Wedding Live Streaming Directory
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight">
              Every love story deserves{' '}
              <em className="text-primary not-italic font-normal">every guest</em>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Find trusted live streaming professionals who bring your wedding day to the people who matter most — wherever they are in the world.
            </p>

            <div className="mt-10 max-w-2xl mx-auto">
              <SearchBar variant="hero" />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {stats.vendorCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{stats.vendorCount}+</span> Verified Vendors
                </span>
              )}
              {stats.stateCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{stats.stateCount}+</span> States Covered
                </span>
              )}
              <span className="flex items-center gap-1.5"><span className="font-semibold text-foreground">Free</span> To Search &amp; Contact</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20 md:py-24">
        <div className="text-center mb-14">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">Simple Process</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">How It Works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { n: 1, icon: MapPin,         title: 'Search Your City',     body: 'Enter your location to instantly discover live streaming vendors serving your area. Filter by city, state, or region.' },
            { n: 2, icon: Sparkles,       title: 'Compare Vendors',      body: 'Browse profiles, view portfolios, and explore services. Every listing includes contact details so you can connect directly.' },
            { n: 3, icon: MessageSquare,  title: 'Message Your Favorites', body: 'Reach out directly to the vendors you love. No middlemen, no booking fees — just a direct connection with your professional.' },
          ].map((step) => (
            <div key={step.n} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-primary mb-4 relative">
                <step.icon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {step.n}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED VENDORS */}
      <section className="bg-secondary/30 py-20 md:py-24">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">Hand-Picked</p>
              <h2 className="font-display text-3xl md:text-4xl font-medium">Featured Vendors</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/directory">
                View All Vendors
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-background/50">
              <p className="text-muted-foreground">
                We&rsquo;re just getting started — check back soon for featured vendors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BROWSE BY STATE */}
      <section className="container py-20 md:py-24">
        <div className="text-center mb-10">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">Find Vendors Near You</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">Browse by State</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {POPULAR_STATES.map((slug) => {
            const state = US_STATES.find((s) => s.slug === slug);
            if (!state) return null;
            return (
              <Link
                key={slug}
                href={`/wedding-live-streaming-${slug}`}
                className="px-4 py-2 rounded-full border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {state.name}
              </Link>
            );
          })}
          <Link
            href="/directory"
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            All States →
          </Link>
        </div>
      </section>

      {/* CTA FOR VENDORS */}
      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-16 text-center">
          <Heart className="h-10 w-10 fill-primary text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Get discovered by couples searching in your area
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Create a listing in minutes and start receiving direct inquiries from couples planning their wedding. Free to list — upgrade to Featured for top placement.
          </p>
          <Button asChild size="lg">
            <Link href="/submit-listing">List Your Business Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
