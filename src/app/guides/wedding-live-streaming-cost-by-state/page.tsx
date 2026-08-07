import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  DatasetJsonLd,
  FaqJsonLd,
} from '@/components/json-ld';
import { US_STATES } from '@/lib/states';
import costData from '@/lib/data/cost-by-state.generated.json';

const { national, states, sampleSize, stateCount, dataYear, generatedAt } = costData;

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

const stateSlug = (code: string) =>
  US_STATES.find((s) => s.abbreviation === code)?.slug ?? null;

// States with 2+ priced vendors get a real median; single-vendor states are
// shown separately so we never present one business's price list as a "state
// average".
const MAIN_STATES = states.filter((s) => s.vendorCount >= 2);
const LIMITED_STATES = states.filter((s) => s.vendorCount === 1);

const cheapest = [...MAIN_STATES].sort((a, b) => a.medianStart - b.medianStart)[0];
const priciest = [...MAIN_STATES].sort((a, b) => b.medianStart - a.medianStart)[0];

export const metadata: Metadata = {
  title: `Average Wedding Live Streaming Cost by State (${dataYear} Data)`,
  description: `Real published pricing from ${sampleSize} wedding livestream vendors across ${stateCount} states. National median starting price: ${fmt(national.medianStart)}, with most packages between ${fmt(national.p25Start)} and ${fmt(national.p75Start)}.`,
  alternates: { canonical: '/guides/wedding-live-streaming-cost-by-state' },
};

const FAQ_ITEMS = [
  {
    question: 'What is the average cost of wedding live streaming in the U.S.?',
    answer: `Based on published pricing from ${sampleSize} professional vendors in our directory, the national median starting price is ${fmt(national.medianStart)}. The middle half of vendors start between ${fmt(national.p25Start)} and ${fmt(national.p75Start)}, and full multi-camera productions can reach ${fmt(national.maxHigh)}.`,
  },
  {
    question: 'Which state has the cheapest wedding live streaming?',
    answer: `Among states with multiple priced vendors in our data, ${cheapest.name} has the lowest median starting price at ${fmt(cheapest.medianStart)} — driven largely by high-volume chapel and elopement packages. Note that many vendors travel, so couples in expensive markets can often book a vendor from a neighboring state.`,
  },
  {
    question: 'Why do prices vary so much between states?',
    answer:
      'Three things drive the spread: local cost of living and videographer day rates, how many vendors compete in the market, and what kind of service dominates locally — high-volume chapel streaming is far cheaper per event than a custom multi-camera crew traveling to a private venue.',
  },
  {
    question: 'Where does this data come from?',
    answer: `Every figure is computed from pricing that vendors publish on their own websites, collected while building the WeddingLiveStreaming.com directory (${sampleSize} of the vendors listed publish usable prices). We record each source URL. No estimates, surveys, or self-reported numbers — if a vendor doesn't publish pricing, they aren't counted.`,
  },
  {
    question: 'Can I use these numbers in an article or report?',
    answer: `Yes — this data is free to cite with attribution to WeddingLiveStreaming.com and a link to this page. It's refreshed as the directory grows (last updated ${generatedAt}).`,
  },
];

export default function CostByStatePage() {
  return (
    <div>
      <ArticleJsonLd
        headline={`Average Wedding Live Streaming Cost by State (${dataYear})`}
        description={`Real published pricing from ${sampleSize} wedding livestream vendors across ${stateCount} states, with medians and ranges per state.`}
      />
      <DatasetJsonLd
        name={`Wedding Live Streaming Pricing by U.S. State, ${dataYear}`}
        description={`Starting prices and package ranges published by ${sampleSize} professional wedding live streaming vendors across ${stateCount} U.S. states, aggregated to state-level medians by WeddingLiveStreaming.com.`}
        url="/guides/wedding-live-streaming-cost-by-state"
        dateModified={generatedAt}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          {
            name: 'Cost by State',
            path: '/guides/wedding-live-streaming-cost-by-state',
          },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Original Data · Updated {generatedAt}</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Average Wedding Live Streaming Cost by State ({dataYear})
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Across {sampleSize} professional vendors with published pricing in our directory, the
              national median starting price for wedding live streaming is {fmt(national.medianStart)}.
              Most vendors start between {fmt(national.p25Start)} and {fmt(national.p75Start)}, with
              full multi-camera productions reaching {fmt(national.maxHigh)}.
            </strong>
          </p>
          <p className="mt-4 text-sm text-muted-foreground max-w-3xl">
            Unlike survey-based estimates, every number below comes from prices vendors publish on
            their own websites — collected and aggregated by WeddingLiveStreaming.com. Free to cite
            with attribution.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
          Median starting price by state
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          States are listed where at least two vendors in our directory publish pricing. &ldquo;Starting
          price&rdquo; is the lowest advertised package; &ldquo;full range&rdquo; spans the cheapest
          starting price to the most expensive top package we found in that state. Click a state to
          see its vendors.
        </p>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left font-semibold p-4">State</th>
                <th className="text-left font-semibold p-4">Median starting price</th>
                <th className="text-left font-semibold p-4">Full range</th>
                <th className="text-left font-semibold p-4">Priced vendors</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MAIN_STATES.map((s) => {
                const slug = stateSlug(s.code);
                return (
                  <tr key={s.code}>
                    <td className="p-4 font-medium">
                      {slug ? (
                        <Link
                          href={`/wedding-live-streaming-${slug}`}
                          className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                        >
                          {s.name}
                        </Link>
                      ) : (
                        s.name
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">{fmt(s.medianStart)}</td>
                    <td className="p-4 whitespace-nowrap text-muted-foreground">
                      {fmt(s.minStart)} – {fmt(s.maxHigh)}
                    </td>
                    <td className="p-4 text-muted-foreground">{s.vendorCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {LIMITED_STATES.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Limited data (one priced vendor each):{' '}
            {LIMITED_STATES.map((s, i) => {
              const slug = stateSlug(s.code);
              return (
                <span key={s.code}>
                  {i > 0 && ', '}
                  {slug ? (
                    <Link
                      href={`/wedding-live-streaming-${slug}`}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {s.name}
                    </Link>
                  ) : (
                    s.name
                  )}{' '}
                  (from {fmt(s.minStart)})
                </span>
              );
            })}
            .
          </p>
        )}
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            What the data shows
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The cheapest market in our data is {cheapest.name}, with a median starting price of{' '}
            {fmt(cheapest.medianStart)} — a reflection of high-volume chapel and elopement
            streaming, where the same crew and rig can cover several ceremonies a day. At the other
            end, {priciest.name} vendors start at a median of {fmt(priciest.medianStart)}, where
            most listed vendors are full-production videography studios offering livestreaming as
            part of multi-camera packages.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The national spread — {fmt(national.minStart)} at the very bottom to{' '}
            {fmt(national.maxHigh)} at the top — is really a spread between service models, not just
            geography. Remote-production services and chapel add-ons anchor the low end; dedicated
            multi-camera crews with a switcher, backup internet, and an edited recording anchor the
            high end. Our{' '}
            <Link href="/guides/wedding-live-streaming-cost" className="underline underline-offset-4 hover:text-primary">
              cost guide
            </Link>{' '}
            breaks down what each tier includes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            One practical note for couples in thin or expensive markets: many vendors publish a free
            travel radius and travel beyond it for a fee, and some travel nationwide. A quote from a
            vendor one state over is often cheaper than the local median.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Methodology</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          WeddingLiveStreaming.com maintains a directory of {costData.directorySize}+ wedding live
          streaming vendors across the U.S. While building each listing, we record the pricing each
          vendor publishes on their own website, including package names, prices, and the source
          URL. {sampleSize} vendors publish a usable dollar figure; vendors with
          &ldquo;contact for quote&rdquo; pricing are excluded rather than estimated.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          &ldquo;Starting price&rdquo; is each vendor&rsquo;s lowest advertised livestream package.
          State medians are computed over vendors headquartered in that state and rounded to the
          nearest $25. States with a single priced vendor are reported separately rather than
          presented as an average. Data is refreshed as the directory grows; this page was last
          updated {generatedAt}.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Journalists and bloggers: you&rsquo;re welcome to cite these figures with attribution and
          a link to this page. For state-level detail or comment,{' '}
          <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
            contact us
          </Link>
          .
        </p>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            See real pricing in your state
          </h2>
          <p className="text-muted-foreground mb-8">
            Browse vendors near you and request quotes directly — free for couples.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md"
            >
              <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                {item.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
