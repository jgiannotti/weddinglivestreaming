import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';

// Product + Offer schema for the vendor plans — makes the membership terms
// machine-readable for search/AI engines answering "what does a listing on
// weddinglivestreaming.com cost".
function PricingJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'WeddingLiveStreaming Vendor Listing',
    description:
      'A vendor listing in the nationwide wedding live streaming directory. Basic listings are free; Featured listings get top placement in search results.',
    url: `${BASE}/pricing`,
    brand: { '@type': 'Organization', name: 'WeddingLiveStreaming' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic Listing',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free vendor listing with full profile, search visibility, and direct messaging. 12-month duration.',
        url: `${BASE}/submit-listing`,
      },
      {
        '@type': 'Offer',
        name: 'Featured Listing (Monthly)',
        price: '29',
        priceCurrency: 'USD',
        description: 'Top placement in search results, gold Featured badge, homepage spotlight, instant lead access. Billed monthly.',
        url: `${BASE}/submit-listing`,
      },
      {
        '@type': 'Offer',
        name: 'Featured Listing (Annual)',
        price: '199',
        priceCurrency: 'USD',
        description: 'All Featured benefits, billed annually (save 43% vs. monthly).',
        url: `${BASE}/submit-listing`,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export const metadata: Metadata = {
  title: 'Vendor Pricing',
  description: "Start for free. Upgrade when you're ready to grow. No contracts, no surprises.",
  alternates: { canonical: '/pricing' },
};

const BASIC_FEATURES = [
  'Complete vendor profile',
  'Location-based search visibility',
  'Direct messages from couples',
  'Photos & service description',
  'Contact information display',
  '12-month listing duration',
];

const FEATURED_FEATURES = [
  'Everything in Basic',
  'Instant access to new couple quote requests (Basic vendors see them 24 hours later)',
  'Top placement in search results',
  'Gold "Featured" badge on listing',
  'Homepage spotlight carousel',
  'Priority in city & state searches',
  '12-month listing duration',
];

const FAQ = [
  {
    q: 'Can I really list for free?',
    a: 'Yes. A Basic listing is 100% free and stays active for 12 months. You get a full profile, location visibility, and direct messaging — no credit card required.',
  },
  {
    q: 'What does "Featured" placement mean exactly?',
    a: 'Featured listings appear at the top of search results in your area, above Basic listings. They also display a gold "Featured" badge and appear in the Featured Vendors section on the homepage. This significantly increases your visibility with couples actively searching.',
  },
  {
    q: 'Are there any fees when a couple contacts me?',
    a: "Never. We don't charge booking fees, commission, or any per-inquiry costs. The monthly fee is the only cost — what happens between you and the couple is entirely between you.",
  },
  {
    q: 'Can I cancel my Featured plan anytime?',
    a: 'Yes. Cancel anytime from your account dashboard. Your listing reverts to Basic at the end of your billing period. Annual plans are non-refundable but can be cancelled to prevent renewal.',
  },
  {
    q: 'How do I upgrade from Basic to Featured?',
    a: 'Log in to your account, go to your listing dashboard, and select "Upgrade to Featured." You can upgrade at any time after your listing goes live.',
  },
];

export default function PricingPage() {
  return (
    <div>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Vendor Pricing', path: '/pricing' }]} />
      <FaqJsonLd items={FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      <PricingJsonLd />
      {/* HERO */}
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20 text-center">
          <p className="eyebrow mb-3">Vendor Plans</p>
          <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free. Upgrade when you&rsquo;re ready to grow. No contracts, no surprises.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="container -mt-8 md:-mt-12 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {/* BASIC */}
          <div className="rounded-2xl border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold mb-1">Basic Listing</h2>
              <p className="text-sm text-muted-foreground">Free — always</p>
            </div>
            <div className="mb-6">
              <span className="font-display text-5xl font-medium">$0</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/submit-listing">Create Free Listing</Link>
            </Button>
          </div>

          {/* FEATURED — ink variant, dark-vs-light contrast makes the upsell obvious */}
          <div className="relative rounded-2xl bg-ink text-ink-foreground p-8 flex flex-col shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium gold-gradient text-white shadow-sm">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold mb-1">Featured Listing</h2>
              <p className="text-sm text-ink-foreground/60">Top placement &amp; priority visibility</p>
            </div>
            <div className="mb-1">
              <span className="font-display text-5xl font-medium">$29</span>
              <span className="text-ink-foreground/60 ml-1">/month</span>
            </div>
            <p className="text-sm text-ink-foreground/60 mb-6">or $199/year — save 43%</p>
            <ul className="space-y-3 mb-8 flex-1">
              {FEATURED_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-ink-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="w-full bg-background text-foreground hover:bg-background/90">
              <Link href="/submit-listing">Get Featured</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-20 max-w-3xl">
        <p className="eyebrow mb-3 text-center">Common Questions</p>
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10">Pricing FAQ</h2>

        <div className="space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md"
            >
              <summary className="cursor-pointer font-semibold flex items-center justify-between">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Ready to Start Growing?</h2>
          <p className="text-muted-foreground mb-8">
            Create your free listing today. No credit card needed.
          </p>
          <Button asChild size="lg">
            <Link href="/submit-listing">List Your Business Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
