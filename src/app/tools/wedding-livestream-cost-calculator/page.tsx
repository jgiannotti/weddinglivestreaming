import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';
import { CostCalculator } from '@/components/cost-calculator';
import { PublisherNote } from '@/components/publisher-note';
import costData from '@/lib/data/cost-by-state.generated.json';

const { national, sampleSize, stateCount, dataYear, generatedAt } = costData;
const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com';
const PATH = '/tools/wedding-livestream-cost-calculator';

export const metadata: Metadata = {
  title: `Wedding Livestream Cost Calculator (${dataYear}) — Estimate by State, Cameras & Coverage`,
  description: `Free calculator that estimates what a professional wedding livestream costs in your state, based on published pricing from ${sampleSize} vendors. Adjust cameras, coverage, travel and add-ons.`,
  alternates: { canonical: PATH },
};

const FAQ_ITEMS = [
  {
    question: 'How accurate is this wedding livestream cost calculator?',
    answer: `The starting point is real: the median published starting price of vendors in your state (or nationally, ${fmt(national.medianStart)}, when a state has fewer than two priced vendors). The adjustments for cameras, coverage and add-ons are editorial multipliers based on how vendors in our directory price those options, so treat the result as a budgeting range, not a quote.`,
  },
  {
    question: 'What does a basic wedding livestream cost?',
    answer: `One camera, one operator, ceremony only: across ${sampleSize} vendors with published pricing, the national median starting price is ${fmt(national.medianStart)}, and the middle half of vendors start between ${fmt(national.p25Start)} and ${fmt(national.p75Start)}.`,
  },
  {
    question: 'Why does adding a second camera cost so much more?',
    answer:
      'A second angle usually means a second operator or a fixed rig plus a switcher, and someone whose job is cutting between shots live. That is more gear, more setup time and a more skilled crew, which is why two-camera packages in our data typically run around 1.5 times the single-camera price.',
  },
  {
    question: 'Do vendors charge for travel?',
    answer:
      'Most publish a free radius, commonly 20 to 30 miles, and charge mileage or a flat fee beyond it. The calculator adds a modest travel allowance for 30–75 miles and a larger one beyond 75 miles; for destination weddings, ask vendors directly since some travel nationwide with lodging included in a package.',
  },
  {
    question: 'Is a recording included in the price?',
    answer:
      'Often, but not always. Many vendors include a downloadable recording; others charge a small fee or an extended-access fee to keep the stream available beyond 30–90 days. An edited highlight video is almost always a separate add-on.',
  },
];

export default function CostCalculatorPage() {
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Wedding Livestream Cost Calculator',
    url: `${BASE}${PATH}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: `Estimates professional wedding livestream cost by U.S. state, camera count, coverage, travel and add-ons, from published pricing of ${sampleSize} vendors.`,
    isBasedOn: `${BASE}/guides/wedding-live-streaming-cost-by-state`,
    dateModified: generatedAt,
    publisher: { '@id': `${BASE}/#organization` },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Cost Calculator', path: PATH },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Free Tool · Data updated {generatedAt}</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Livestream Cost Calculator
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              A professional wedding livestream typically starts around {fmt(national.medianStart)}{' '}
              for one camera and the ceremony, with most vendors starting between{' '}
              {fmt(national.p25Start)} and {fmt(national.p75Start)}. Pick your state, cameras and
              coverage below for a budget range built from the published pricing of {sampleSize}{' '}
              vendors across {stateCount} states.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <CostCalculator />
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            How this estimate works
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The base number is the median starting price that vendors headquartered in your state
            publish on their own websites, taken from our{' '}
            <Link href="/guides/wedding-live-streaming-cost-by-state" className="underline underline-offset-4 hover:text-primary">
              cost-by-state dataset
            </Link>
            . States with fewer than two priced vendors fall back to the national median of{' '}
            {fmt(national.medianStart)} so a single vendor&rsquo;s price list is never presented as
            a state average.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            From there the calculator applies plain multipliers that reflect how vendors in our data
            price their options: two cameras at roughly 1.5× the base, three or more switched
            cameras at about 2.1×; ceremony plus toasts and first dance at 1.35×, full-day coverage
            at 1.8×; a $125 allowance for 30–75 miles of travel and $300 beyond that; $75 for a
            downloadable recording and $400 for an edited highlight video. The range shown is 80%
            to 130% of that figure, which is about how widely comparable quotes spread in practice.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            None of this replaces a quote. It replaces guessing. Our{' '}
            <Link href="/guides/wedding-live-streaming-cost" className="underline underline-offset-4 hover:text-primary">
              cost guide
            </Link>{' '}
            explains what each price tier includes, and the{' '}
            <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="underline underline-offset-4 hover:text-primary">
              questions to ask
            </Link>{' '}
            will tell you whether a low quote is a bargain or a warning sign.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
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

      <PublisherNote />
    </div>
  );
}
