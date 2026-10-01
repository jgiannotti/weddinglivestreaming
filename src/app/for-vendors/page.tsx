import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/reveal';
import { Target, MessageSquare, MapPin, Sparkles, Infinity as InfinityIcon, Bot, BarChart3 } from 'lucide-react';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';
import { getListingStats } from '@/lib/data/listings';
import { FOUNDING_MONTHS } from '@/lib/founding-shared';
import { FOUNDING_FAQ_ANSWER, FEATURED_BENEFITS, CANCEL_SENTENCE, MATCHING_SENTENCE } from '@/lib/vendor-copy';

// Title and description are written for what a vendor actually types into a
// search box or asks an AI assistant ("list my wedding live streaming
// business", "free wedding videographer directory"), not for our own nav
// label. This page was titled "For Vendors", which matches no query at all.
export const metadata: Metadata = {
  title: { absolute: 'List Your Wedding Live Streaming Business for Free' },
  description:
    'Claim or add a free listing in the only U.S. directory dedicated to wedding live streaming. Quote requests come straight to you. No commission.',
  alternates: { canonical: '/for-vendors' },
};

// Every line below describes something the product does today. No traffic or
// booking promises: a vendor weighing a directory is asking "is this real?",
// and an overclaim answers that the wrong way.
const REASONS = [
  { icon: Target,        title: 'Only livestream vendors',      body: 'No photographers, florists or caterers competing for attention. Every listing here is a business that streams weddings.' },
  { icon: MessageSquare, title: 'Inquiries come to you',        body: 'Couples’ quote requests and messages go straight to you. You own the relationship, and there is no fee on bookings.' },
  { icon: MapPin,        title: 'Matched by location',          body: 'You set your service radius. Couples whose venue falls inside it find you in search, and each quote request goes to up to three vendors: Featured vendors in range first, then the nearest.' },
  { icon: InfinityIcon,  title: 'Free, with no expiration',     body: 'A Basic listing costs nothing and never expires. Featured placement is optional.' },
  { icon: Bot,           title: 'Readable by search and AI',    body: 'Each profile is a fast, structured page with your business details in the structured format search engines read, so Google and AI assistants like ChatGPT, Claude and Perplexity can read it accurately.' },
  { icon: BarChart3,     title: 'Real numbers in your dashboard', body: 'See how often your profile was opened, how many quote requests were matched to you, and how often ChatGPT, Claude and Perplexity fetched your page.' },
];

const STEPS = [
  { title: 'A couple requests quotes', body: 'On a state page or your own profile, a couple fills in one short form: their name, email and venue state, plus the wedding date, venue city, guest count and phone number if they choose to add them.' },
  { title: 'We match up to three vendors', body: MATCHING_SENTENCE },
  { title: 'You get their details', body: 'Claimed vendors receive the couple’s name and email, plus their phone number if they gave one, by email and in the dashboard, and reply directly.' },
];

const FAQ = [
  {
    question: 'Is a listing really free?',
    answer:
      'Yes. A Basic listing is free and does not expire. It includes a full profile, location-based search visibility, couple quote requests and direct messages. No credit card is needed.',
  },
  {
    question: 'My business is already listed. How did that happen, and how do I claim it?',
    answer:
      'We built the directory mostly from what vendors publish on their own websites. If your business is listed, find it at weddinglivestreaming.com/claim, create a free account and tell us how we can verify it is yours. We review claims by hand, usually within one business day. If we emailed you a claim link, use it and your claim is approved on the spot. If you would rather not be listed, contact us and we will remove it.',
  },
  {
    question: 'How do couples’ inquiries reach me?',
    answer:
      `${MATCHING_SENTENCE} Claimed vendors receive the couple’s name and email, plus their phone number if they gave one, by email and in the dashboard, and reply to the couple directly.`,
  },
  {
    question: 'Do you take a commission or charge per lead?',
    answer:
      'No. There is no commission, no booking fee and no per-lead charge. The only paid option is the optional Featured plan.',
  },
  {
    question: 'What is the founding vendor offer?',
    answer: FOUNDING_FAQ_ANSWER,
  },
  {
    question: 'What does Featured add?',
    answer:
      `Featured means ${FEATURED_BENEFITS}. It costs $29 a month or $199 a year. ${CANCEL_SENTENCE}`,
  },
  {
    question: 'I am a wedding videographer who also live streams. Can I list?',
    answer:
      'Yes. Many vendors in the directory are videography or AV studios that offer live streaming alongside their other services. List the live streaming service you offer and the area you cover.',
  },
];

export default async function ForVendorsPage() {
  // Real counts, never a hardcoded "hundreds".
  const stats = await getListingStats();
  const countLine =
    stats.vendorCount > 0 && stats.stateCount > 0
      ? `${stats.vendorCount} wedding livestream ${stats.vendorCount === 1 ? 'vendor' : 'vendors'} in ${stats.stateCount} ${stats.stateCount === 1 ? 'state' : 'states'} ${stats.vendorCount === 1 ? 'is' : 'are'} in the directory.`
      : 'Wedding livestream vendors across the U.S. are in the directory.';

  return (
    <div>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'For Vendors', path: '/for-vendors' }]} />
      <FaqJsonLd items={FAQ} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20 text-center">
          <p className="eyebrow mb-3">For Wedding Livestream Vendors</p>
          <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            List your wedding live streaming business, free
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            {countLine} If you live stream weddings, you may already be listed. Claim your profile,
            or add your business in about five minutes.
          </p>
          {/* Claim first: the directory was seeded from public sources, so most
              vendors arriving here already have a profile. Sending them to
              "create a listing" produced duplicates and database errors. */}
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
            <Button asChild size="lg"><Link href="/claim">Find &amp; Claim Your Listing</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/submit-listing">Add a New Listing</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free to list. No commission, no booking fees.{' '}
            <Link href="/pricing" className="text-primary font-medium hover:underline">See pricing</Link>
          </p>
        </div>
      </section>

      {/* FOUNDING OFFER */}
      <section className="container pt-16 md:pt-20">
        <div className="rounded-3xl border border-gold/40 bg-gold/10 p-8 md:p-10 max-w-4xl mx-auto">
          <p className="eyebrow text-gold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Founding vendor offer
          </p>
          <h2 className="font-display text-2xl md:text-3xl mb-3">
            Featured free for {FOUNDING_MONTHS} months
          </h2>
          <p className="text-muted-foreground prose-measure">
            Claim or add your listing, then add your starting price and a cover photo. Your listing
            becomes Featured: top placement in search, the gold Featured badge, a turn in the
            homepage spotlight, and priority when couples request quotes in your area. No card
            needed and nothing is charged automatically. After {FOUNDING_MONTHS} months it returns
            to a free Basic listing unless you choose to subscribe at $29 a month.
          </p>
        </div>
      </section>

      {/* HOW INQUIRIES WORK */}
      <Reveal>
        <section className="container py-16 md:py-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl">How a couple&rsquo;s inquiry reaches you</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.title} className="border-t border-border pt-6">
                <span className="font-display text-5xl italic text-primary/25">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-2xl mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container pb-20 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-accent/50 rotate-1" aria-hidden="true" />
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/images/hero-b.jpg"
                  alt="A wedding videographer capturing footage with a professional camera rig"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="eyebrow mb-3">Why List With Us</p>
              <h2 className="font-display text-3xl md:text-4xl mb-5">Built for Live Streaming Professionals</h2>
              <p className="text-muted-foreground prose-measure">
                We&rsquo;re the only U.S. directory dedicated to wedding live streaming. Couples who
                come here are looking for exactly what you offer: not photography, not florals, just
                someone who can put their ceremony on screen for the guests who can&rsquo;t be there.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {REASONS.map((r) => (
              <div key={r.title} className="rounded-2xl border bg-card p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary mb-4">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container pb-20">
          <div className="rounded-3xl border bg-card p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="eyebrow mb-3">Free For Listed Vendors</p>
                <h2 className="font-display text-2xl md:text-3xl mb-4">
                  Show Off Your &ldquo;Featured On&rdquo; Badge
                </h2>
                <p className="text-muted-foreground mb-6">
                  Already listed? Add the official badge to your website. It links couples straight
                  to your directory profile.
                </p>
                <Button asChild variant="outline">
                  <Link href="/vendor-badge">Get Your Badge →</Link>
                </Button>
              </div>
              <div className="flex justify-center">
                {/* Static preview of the light badge on the card surface */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badge/featured-on-wls.svg"
                  alt="Featured on WeddingLiveStreaming.com badge"
                  width={260}
                  height={64}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQ. Plain <details> so the answers are in the HTML for crawlers and
          AI assistants, matching the FAQPage schema above word for word. */}
      <section className="container pb-20 max-w-3xl">
        <p className="eyebrow mb-3 text-center">Vendor Questions</p>
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10">Listing FAQ</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <details key={item.question} className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md">
              <summary className="cursor-pointer font-semibold flex items-center justify-between">
                {item.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-3">Get your listing working for you</h2>
          <p className="text-muted-foreground mb-8">
            Claim the profile you already have, or add your business. Both are free.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/claim">Find &amp; Claim Your Listing</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/submit-listing">Add a New Listing</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            New to livestreaming weddings? Read{' '}
            <Link href="/guides/how-to-start-a-wedding-livestreaming-business" className="text-primary font-medium hover:underline">
              how to start a wedding livestreaming business
            </Link>{' '}
            and benchmark your rates against{' '}
            <Link href="/guides/wedding-live-streaming-cost-by-state" className="text-primary font-medium hover:underline">
              median prices in your state
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
