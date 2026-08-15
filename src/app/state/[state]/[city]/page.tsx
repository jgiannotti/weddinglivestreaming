import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/listing-card';
import { getStateBySlug } from '@/lib/states';
import { getListings, getListingsByLocation, getCitiesWithListings } from '@/lib/data/listings';
import { slugify } from '@/lib/utils';
import { BreadcrumbJsonLd, ListingsItemListJsonLd, FaqJsonLd } from '@/components/json-ld';
import costData from '@/lib/data/cost-by-state.generated.json';

const fmtUsd = (n: number) => `$${n.toLocaleString('en-US')}`;

// City-specific FAQ built from real data: state-level median pricing from the
// directory's own dataset, and the radius-search behavior that powers this
// page's vendor grid. This is what makes each city page substantively unique
// rather than a templated shell — and it targets the "wedding livestream
// [city]" question cluster that GSC shows earning impressions.
function buildCityFaqs(cityName: string, stateName: string, stateCode: string, vendorCount: number) {
  const stateRow = costData.states.find((s) => s.code === stateCode);
  const nat = costData.national;
  const costAnswer = stateRow
    ? `Based on published vendor pricing in our directory, livestream packages in ${stateName} typically start around ${fmtUsd(stateRow.medianStart)} (the state median). Nationally, most professional ceremony streams start between ${fmtUsd(nat.p25Start)} and ${fmtUsd(nat.p75Start)}. Vendors serving ${cityName} list their own starting prices on their profiles, so you can compare exact numbers before reaching out.`
    : `Nationally, most professional wedding livestream packages start between ${fmtUsd(nat.p25Start)} and ${fmtUsd(nat.p75Start)}, with a median starting price of ${fmtUsd(nat.medianStart)}. Vendors serving ${cityName} list their own starting prices on their profiles, so you can compare exact numbers before reaching out.`;

  return [
    {
      question: `How much does wedding live streaming cost in ${cityName}?`,
      answer: costAnswer,
    },
    {
      question: `Do I need a vendor based in ${cityName} itself?`,
      answer: `No — most wedding livestream vendors travel. The ${vendorCount > 0 ? `${vendorCount} vendor${vendorCount === 1 ? '' : 's'} shown here` : 'vendors shown here'} include professionals whose coverage area reaches ${cityName}, not just businesses headquartered in it. Many list a travel radius or serve their whole region, so a vendor a town over is often the right choice.`,
    },
    {
      question: `Can my wedding videographer also livestream the ceremony?`,
      answer: `Often, yes — many wedding videographers offer livestreaming as an add-on, and several vendors serving ${cityName} are videography studios that do both. It can be cost-effective to bundle, but ask the livestream-specific questions before assuming: whether a dedicated operator runs the stream (or a camera is simply left running), what the backup internet plan is, and whether streaming is priced separately from the film.`,
    },
    {
      question: `How do I book a wedding livestream in ${cityName}?`,
      answer: `Compare the vendors below, open a profile, and message them directly with your date and venue — it's free for couples, with no booking fees or commission. Before you book anyone, run through our vetting checklist (backup internet, audio plan, what's included in the price) so you can compare answers side by side.`,
    },
  ];
}

interface PageProps {
  params: Promise<{ state: string; city: string }>;
}

// Programmatic long-tail pages: only generated for (state, city) pairs that
// actually have ≥1 approved listing — a city with zero vendors 404s instead
// of shipping a thin, empty page. Dynamic (no generateStaticParams caching)
// since new cities appear as vendors get approved.
async function resolveCity(stateSlug: string, citySlug: string) {
  const stateInfo = getStateBySlug(stateSlug);
  if (!stateInfo) return null;

  const pairs = await getCitiesWithListings();
  const match = pairs.find(
    (p) => p.state.toLowerCase() === stateInfo.name.toLowerCase() && slugify(p.city) === citySlug
  );
  if (!match) return null;

  return { stateInfo, cityName: match.city };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state, city } = await params;
  const resolved = await resolveCity(state, city);
  if (!resolved) return { title: 'City Not Found' };
  const { stateInfo, cityName } = resolved;
  return {
    title: `Wedding Live Streaming in ${cityName}, ${stateInfo.abbreviation}`,
    description: `Find and connect with professional wedding live streaming vendors serving ${cityName}, ${stateInfo.name}.`,
    alternates: { canonical: `/wedding-live-streaming-${stateInfo.slug}/${city}` },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { state, city } = await params;
  const resolved = await resolveCity(state, city);
  if (!resolved) notFound();
  const { stateInfo, cityName } = resolved;

  // Milestone 2: radius search from this city's own-DB centroid, not an
  // exact city-name match — a Clearwater page now correctly surfaces a
  // Tampa vendor whose coverage radius reaches Clearwater, which also
  // fattens thin city pages instead of leaving them empty. Falls back to
  // the old exact-match query if the city can't be resolved in the cities
  // table (rare — it would already need a real listing to have a page).
  const radiusResult = await getListingsByLocation(`${cityName}, ${stateInfo.abbreviation}`);
  const listings = radiusResult.resolvedLabel
    ? radiusResult.listings
    : await getListings({ state: stateInfo.name, city: cityName });

  const cityFaqs = buildCityFaqs(cityName, stateInfo.name, stateInfo.abbreviation, listings.length);

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: stateInfo.name, path: `/wedding-live-streaming-${stateInfo.slug}` },
          { name: cityName, path: `/wedding-live-streaming-${stateInfo.slug}/${city}` },
        ]}
      />
      {listings.length > 0 && <ListingsItemListJsonLd listings={listings} />}
      <FaqJsonLd items={cityFaqs} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">
              {stateInfo.name} Directory
            </p>
            <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
              Wedding Live Streaming<br />in {cityName}, {stateInfo.abbreviation}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl font-medium">
              Connect directly with professional wedding live streaming vendors serving{' '}
              {cityName} couples — free to search and message, no booking fees.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <span><span className="font-semibold text-foreground">{listings.length}+</span> Vendors</span>
              <span><span className="font-semibold text-foreground">Free</span> To Contact</span>
              <span><span className="font-semibold text-foreground">Direct</span> Messaging</span>
            </div>
            <Button asChild className="mt-8">
              <Link href={`/directory?location=${encodeURIComponent(cityName)}`}>
                Search {cityName} Vendors
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-medium">
            Live Streaming Vendors in {cityName}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* CITY FAQ — mirrors the state pages' FAQ treatment with city-level,
          data-driven answers (state median pricing, radius coverage). */}
      <section className="container py-16 border-t max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-8">
          Wedding Livestreaming in {cityName}: Quick Answers
        </h2>
        <div className="space-y-3">
          {cityFaqs.map((item) => (
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

      {/* PLANNING RESOURCES — same rationale as the state page: city pages are
          indexed long-tail entry points, so they should feed the guides too. */}
      <section className="container py-16 border-t max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Planning a Livestream in {cityName}?
        </h2>
        <p className="text-muted-foreground mb-6">Three quick reads before you message vendors:</p>
        <ul className="space-y-3">
          <li>
            <Link href="/guides/wedding-live-streaming-cost-by-state" className="font-semibold text-primary hover:underline">
              What livestreaming costs in {stateInfo.name}
            </Link>
            <span className="text-muted-foreground"> — median starting prices from this directory&rsquo;s published vendor pricing.</span>
          </li>
          <li>
            <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="font-semibold text-primary hover:underline">
              Questions to ask before you book
            </Link>
            <span className="text-muted-foreground"> — the ten-question vetting checklist.</span>
          </li>
          <li>
            <Link href="/guides/wedding-livestream-invitation-wording" className="font-semibold text-primary hover:underline">
              How to invite remote guests
            </Link>
            <span className="text-muted-foreground"> — copy-paste wording for insert cards, websites, and texts.</span>
          </li>
        </ul>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
            Looking Beyond {cityName}?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Browse every vendor serving {stateInfo.name}, or list your own business free.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href={`/wedding-live-streaming-${stateInfo.slug}`}>All {stateInfo.name} Vendors</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/submit-listing">List Your Business Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
