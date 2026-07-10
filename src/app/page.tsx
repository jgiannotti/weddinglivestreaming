import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { ListingCard } from '@/components/listing-card';
import { Reveal } from '@/components/reveal';
import { getFeaturedListings, getListingStats } from '@/lib/data/listings';
import { US_STATES } from '@/lib/states';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const POPULAR_STATES = ['california', 'texas', 'florida', 'new-york', 'georgia', 'pennsylvania', 'illinois', 'ohio', 'north-carolina', 'michigan', 'arizona', 'massachusetts', 'washington', 'colorado', 'virginia', 'tennessee'];

const HOW_IT_WORKS = [
  { n: '01', title: 'Search Your City', body: 'Enter your location to instantly discover live streaming vendors serving your area. Filter by city, state, or region.' },
  { n: '02', title: 'Compare Vendors', body: 'Browse profiles, view portfolios, and explore services. Every listing includes contact details so you can connect directly.' },
  { n: '03', title: 'Message Your Favorites', body: 'Reach out directly to the vendors you love. No middlemen, no booking fees — just a direct connection with your professional.' },
];

export default async function HomePage() {
  const featured = await getFeaturedListings(8);
  const stats = await getListingStats();

  return (
    <>
      {/* HERO — split editorial layout */}
      <section className="relative overflow-hidden bg-background">
        <div
          className="pointer-events-none absolute -top-24 right-[-10%] h-[560px] w-[560px] rounded-full bg-accent/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="container relative py-16 md:py-20 lg:py-28">
          <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
            {/* Left: copy + search */}
            <div>
              <p className="eyebrow mb-4">The Wedding Livestream Directory</p>
              <h1 className="font-display text-[2.65rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl sm:leading-[1.05]">
                Every love story deserves{' '}
                <em className="italic text-primary">every guest</em>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl prose-measure">
                Find trusted live streaming professionals who bring your wedding day to the people who matter most, wherever they are.
              </p>

              <div className="mt-8">
                <SearchBar variant="hero" />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {stats.vendorCount > 0 && (
                  <span><span className="font-semibold text-foreground">{stats.vendorCount}+</span> Verified Vendors</span>
                )}
                {stats.stateCount > 0 && (
                  <span><span className="font-semibold text-foreground">{stats.stateCount}+</span> States Covered</span>
                )}
                <span><span className="font-semibold text-foreground">Free</span> To Search &amp; Contact</span>
              </div>
            </div>

            {/* Right: photo collage */}
            <div className="relative">
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                <Image
                  src="/images/hero-a.jpg"
                  alt="A couple sharing a joyful moment at their wedding"
                  fill
                  priority
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="rounded-2xl object-cover shadow-xl"
                />
                <div className="absolute -bottom-6 -left-3 sm:-bottom-8 sm:-left-8 w-[42%] aspect-square rounded-2xl overflow-hidden border-4 border-background shadow-xl">
                  <Image
                    src="/images/hero-c.jpg"
                    alt="A wedding guest smiling while watching the ceremony live from home"
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute -top-4 right-2 sm:right-6 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur px-4 py-2 shadow-lg motion-safe:animate-float">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  <span className="text-xs font-medium whitespace-nowrap">LIVE · 214 watching from 12 countries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border/70 bg-secondary/20">
        <div className="container py-6">
          {/* No divide-x here — when the row wraps on phones the leftover
              left-borders + padding read as random indents. Plain centered
              gaps wrap cleanly at every width. */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-sm text-muted-foreground">
            {['Vetted professionals', 'Direct contact — no middlemen', 'Free for couples'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Reveal>
        <section className="container py-20 md:py-24">
          <div className="mb-14 max-w-2xl">
            <p className="eyebrow mb-3">Simple Process</p>
            <h2 className="font-display text-3xl md:text-4xl">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="border-t border-border pt-6">
                <span className="font-display italic text-5xl text-primary/25">{step.n}</span>
                <h3 className="font-display text-2xl mt-4 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed prose-measure">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* WHY LIVESTREAM — editorial */}
      <Reveal>
        <section className="container py-20 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-accent/50 -rotate-1" aria-hidden="true" />
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/images/why-livestream.jpg"
                  alt="Grandparents watching a wedding livestream together on a laptop"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <p className="eyebrow mb-3">Why it matters</p>
              <h2 className="font-display text-3xl md:text-4xl mb-5">For the ones who couldn&rsquo;t be there</h2>
              <div className="space-y-4 text-muted-foreground prose-measure">
                <p>Grandparents who can&rsquo;t travel. Friends stationed overseas. Family members whose health keeps them home. A wedding livestream means the day isn&rsquo;t smaller for them — it&rsquo;s just as real, just as present.</p>
                <p>And for the couple, it means looking back years later and reliving the ceremony exactly as it happened, not just through photos taken after the fact.</p>
              </div>
              <p className="font-display italic text-2xl text-primary mt-6">
                Distance shouldn&rsquo;t decide who watches you say I do.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FEATURED / FOUNDING VENDORS */}
      <Reveal>
        <section className="bg-secondary/30 py-20 md:py-24">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="eyebrow mb-2">Hand-Picked</p>
                <h2 className="font-display text-3xl md:text-4xl">Featured Vendors</h2>
              </div>
              {featured.length > 0 && (
                <Button asChild variant="outline">
                  <Link href="/directory">
                    View All Vendors
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {featured.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  src="/images/vendor-cta.jpg"
                  alt="A wedding videographer capturing footage on a camera gimbal"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-ink/70" aria-hidden="true" />
                <div className="relative text-ink-foreground text-center py-16 px-6 md:py-20">
                  <p className="eyebrow text-gold mb-3">Founding Vendors</p>
                  <h3 className="font-display text-3xl md:text-4xl mb-4">Claim a founding spot in your city</h3>
                  <p className="text-ink-foreground/75 max-w-xl mx-auto mb-8">
                    The first vendors to join each market get top placement as the directory grows — before it&rsquo;s competitive.
                  </p>
                  <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-gold-foreground bg-transparent">
                    <Link href="/submit-listing">Become a Founding Vendor</Link>
                  </Button>
                </div>
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
      </Reveal>

      {/* BROWSE BY STATE */}
      <Reveal>
        <section id="browse-by-state" className="container py-20 md:py-24">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Find Vendors Near You</p>
            <h2 className="font-display text-3xl md:text-4xl">Browse by State</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {POPULAR_STATES.map((slug) => {
              const state = US_STATES.find((s) => s.slug === slug);
              if (!state) return null;
              return (
                <Link
                  key={slug}
                  href={`/wedding-live-streaming-${slug}`}
                  className="px-5 py-2.5 rounded-full border border-border/70 bg-card text-sm font-medium hover:border-primary/50 hover:bg-accent/40 transition-colors"
                >
                  {state.name}
                </Link>
              );
            })}
            <Link
              href="/directory"
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              All States →
            </Link>
          </div>
        </section>
      </Reveal>

      {/* VENDOR CTA — the ink moment */}
      <section className="bg-ink text-ink-foreground">
        <div className="container py-20 md:py-24 text-center">
          <p className="eyebrow text-gold mb-4">For Vendors</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4">
            Get discovered by couples searching in your area
          </h2>
          <p className="text-ink-foreground/70 max-w-2xl mx-auto mb-8">
            Create a listing in minutes and start receiving direct inquiries from couples planning their wedding. Free to list — upgrade to Featured for top placement.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90">
              <Link href="/submit-listing">List Your Business — Free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
              <Link href="/pricing">See Featured pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
