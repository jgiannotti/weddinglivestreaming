import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';
import costData from '@/lib/data/cost-by-state.generated.json';

const { national, states, sampleSize, stateCount, dataYear, generatedAt, directorySize } =
  costData;

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

const MAIN_STATES = states.filter((s) => s.vendorCount >= 2);
const cheapest = [...MAIN_STATES].sort((a, b) => a.medianStart - b.medianStart)[0];
const priciest = [...MAIN_STATES].sort((a, b) => b.medianStart - a.medianStart)[0];

export const metadata: Metadata = {
  title: 'Press & Data — Wedding Livestreaming Statistics',
  description: `Original wedding livestreaming statistics and pricing data from ${sampleSize} vendors across ${stateCount} states. Free to cite with attribution. Journalist requests answered within one business day.`,
  alternates: { canonical: '/press' },
};

const FAST_FACTS = [
  {
    stat: fmt(national.medianStart),
    label: 'National median starting price',
    detail: `The midpoint of published starting prices across ${sampleSize} professional wedding livestream vendors.`,
  },
  {
    stat: `${fmt(national.p25Start)}–${fmt(national.p75Start)}`,
    label: 'Where the middle half of vendors start',
    detail: 'The interquartile range of advertised entry-level package prices.',
  },
  {
    stat: fmt(national.maxHigh),
    label: 'Top of the market',
    detail: 'The highest published package price in the dataset — full multi-camera production.',
  },
  {
    stat: `${priciest.name} → ${cheapest.name}`,
    label: 'Most to least expensive state',
    detail: `Median starting prices run from ${fmt(priciest.medianStart)} in ${priciest.name} down to ${fmt(cheapest.medianStart)} in ${cheapest.name}.`,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can I cite WeddingLiveStreaming.com data in my article?',
    answer:
      'Yes. All published figures are free to reuse for any purpose, including commercially, with attribution and a link to the source page. No permission request is required, though we are glad to hear where the data appears.',
  },
  {
    question: 'Where does the pricing data come from?',
    answer: `It is collected from prices vendors publish on their own websites. While building each directory listing we record package names, prices, and the source URL. Of roughly ${directorySize} vendors in the directory, ${sampleSize} publish a usable dollar figure; vendors with "contact for quote" pricing are excluded rather than estimated.`,
  },
  {
    question: 'How current is the data?',
    answer: `The dataset was last regenerated on ${generatedAt} and is refreshed as the directory grows. Every published page states its own last-updated date.`,
  },
  {
    question: 'Can you provide a custom cut of the data or an interview?',
    answer:
      'Yes — state-level breakdowns, regional comparisons, and vendor-side perspective are all available on request. We respond to journalist and researcher enquiries within one business day.',
  },
];

export default function PressPage() {
  return (
    <div>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Press & Data', path: '/press' }]} />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Press &amp; Data</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Livestreaming Statistics &amp; Press Resources
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              We maintain the largest directory of U.S. wedding livestream vendors and publish
              original pricing data drawn from what those vendors actually charge. Everything
              below is free to cite with attribution. For a custom data cut or a quote, email{' '}
              <a href="mailto:hello@weddinglivestreaming.com" className="underline underline-offset-4">
                hello@weddinglivestreaming.com
              </a>
              .
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">Fast facts</h2>
        <p className="text-muted-foreground mb-8">
          {dataYear} figures, from {sampleSize} vendors across {stateCount} states. Last updated{' '}
          {generatedAt}.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {FAST_FACTS.map((f) => (
            <div key={f.label} className="rounded-2xl border bg-card p-6">
              <p className="font-display text-3xl font-semibold text-primary mb-1">{f.stat}</p>
              <h3 className="font-semibold mb-2">{f.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-muted-foreground">
          Full state-by-state tables, methodology, and copy-paste citation formats live on the{' '}
          <Link
            href="/guides/wedding-live-streaming-cost-by-state"
            className="text-primary font-medium hover:underline"
          >
            cost-by-state data page
          </Link>
          .
        </p>
      </section>

      <section className="container py-16 border-t max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          About WeddingLiveStreaming.com
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            WeddingLiveStreaming.com is a nationwide directory connecting engaged couples with
            professionals who stream wedding ceremonies to remote guests. It is free for couples to
            search and message vendors, and the site never takes a booking fee or commission from
            either side.
          </p>
          <p>
            The directory covers roughly {directorySize} vendors across all 50 states. Alongside
            listings, we publish practical guides for couples and original research on what
            livestreaming a wedding actually costs — the pricing study cited above is, as far as we
            know, the only dataset built from vendors&rsquo; own published rates rather than survey
            estimates.
          </p>
          <p>
            <strong className="text-foreground">Suggested description:</strong>{' '}
            &ldquo;WeddingLiveStreaming.com, a nationwide directory of wedding livestream
            professionals.&rdquo;
          </p>
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Working on a story?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            We can provide state-level breakdowns, vendor introductions, and commentary on how
            couples are using livestreaming. Response within one business day.
          </p>
          <Button asChild size="lg">
            <a href="mailto:hello@weddinglivestreaming.com">Email hello@weddinglivestreaming.com</a>
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
