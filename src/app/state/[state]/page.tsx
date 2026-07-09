import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { LeadForm } from '@/components/lead-form';
import { getStateBySlug, US_STATES } from '@/lib/states';
import { getListings } from '@/lib/data/listings';
import { STATE_CONTENT } from '@/lib/state-content';
import { BreadcrumbJsonLd, ListingsItemListJsonLd, FaqJsonLd } from '@/components/json-ld';

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
    alternates: { canonical: `/wedding-live-streaming-${info.slug}` },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { state } = await params;
  const info = getStateBySlug(state);
  if (!info) notFound();

  // Fetch the full unfiltered set for this state so the vendor count shown
  // is real, then cap the on-page grid at 9 — previously the count and the
  // grid used the same limited query, so the count silently capped at "9+"
  // forever even once a state had 50 real vendors.
  const allListings = await getListings({ state: info.name });
  const listings = allListings.slice(0, 9);
  const content = STATE_CONTENT[info.slug];

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: info.name, path: `/wedding-live-streaming-${info.slug}` },
        ]}
      />
      {listings.length > 0 && <ListingsItemListJsonLd listings={listings} />}
      {content && <FaqJsonLd items={content.faqs} />}
      {/* HERO */}
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">Directory</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
              Wedding Live Streaming<br />in {info.name}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl font-medium">
              {content?.intro ??
                `Find and connect with professional wedding live streaming vendors serving couples across ${info.name}.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {allListings.length > 0 && (
                <span><span className="font-semibold text-foreground">{allListings.length}+</span> Vendors</span>
              )}
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
          <p className="eyebrow mb-2">{info.name} Directory</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">
            Live Streaming Vendors in {info.name}
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl bg-accent/30 border border-accent p-8 md:p-12">
            <div className="max-w-lg mx-auto text-center mb-8">
              <h3 className="font-display text-2xl md:text-3xl mb-3">
                Vendors are joining {info.name} city by city
              </h3>
              <p className="text-muted-foreground">
                Tell us your date and city and we&rsquo;ll connect you as soon as a vendor covers your area — free.
              </p>
            </div>
            <div className="max-w-xl mx-auto">
              <LeadForm venueState={info.name} title="Get Free Quotes" />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Serve this area?{' '}
              <Link href="/submit-listing" className="italic text-primary font-medium hover:underline">
                List your business free.
              </Link>
            </p>
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

      {/* FAQ */}
      {content && content.faqs.length > 0 && (
        <section className="container py-16 border-t max-w-3xl">
          <h2 className="font-display text-3xl font-medium mb-8">
            {info.name} Wedding Live Streaming FAQs
          </h2>
          <div className="space-y-3">
            {content.faqs.map((item) => (
              <details key={item.question} className="group rounded-2xl border bg-card p-5 transition-shadow open:shadow-md">
                <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                  {item.question}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* LEAD FORM — only shown here when the state already has listings;
          when it doesn't, the accent-wash empty-state panel above already
          embeds the same LeadForm, so we avoid rendering it twice. */}
      {listings.length > 0 && (
        <section className="container py-16 border-t max-w-xl">
          <div className="mb-8">
            <p className="eyebrow mb-2">Planning in {info.name}?</p>
            <h2 className="font-display text-3xl font-medium mb-2">Get Matched With Vendors</h2>
            <p className="text-muted-foreground">
              Tell us about your wedding and we&rsquo;ll connect you with {info.name} live streaming vendors.
            </p>
          </div>
          <LeadForm venueState={info.name} title="Get Free Quotes" />
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
