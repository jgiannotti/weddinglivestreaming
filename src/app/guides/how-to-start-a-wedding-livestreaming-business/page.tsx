import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Start a Wedding Livestreaming Business',
  description:
    'A practical guide to starting a wedding livestreaming business — startup gear under $2,500, what to charge, how to get your first clients, and how to grow.',
  alternates: { canonical: '/guides/how-to-start-a-wedding-livestreaming-business' },
};

const STEPS = [
  {
    title: 'Start with the gear you can actually afford',
    body: 'You do not need a broadcast truck. A workable starter kit is one good mirrorless camera (or even a recent iPhone on a tripod), a dedicated wireless microphone for the officiant or couple, a bonded-cellular or hotspot internet backup, and a laptop or hardware encoder to push the stream. Most working vendors started under $2,500 in gear and reinvested as bookings came in. Audio is the one place not to cut corners — a distant, echoey camera mic is the #1 complaint from remote guests.',
  },
  {
    title: 'Decide what to charge — and put a starting price in public',
    body: 'Most U.S. wedding livestream packages start between $500 and $1,500 for a single-operator, one-to-two-camera ceremony stream, with multi-camera productions running $1,500–$3,500+. Couples comparison-shop, and vendors who publish a transparent starting price get dramatically more inquiries than "contact for pricing." Anchor low with a defined base package, then upsell multi-camera, reception coverage, and edited replays.',
  },
  {
    title: 'Stream two or three weddings free (or nearly free) to build proof',
    body: 'Your first clients want to see a real wedding you streamed, not a demo reel. Offer free or at-cost streams to friends, your church, or couples booked with a videographer you know. From each, collect three assets: a highlight clip, a testimonial from the couple, and a screenshot of the remote-guest chat lighting up. That portfolio is what converts paid bookings.',
  },
  {
    title: 'Handle the business basics once, early',
    body: 'Form an LLC or equivalent, get general liability insurance (many venues require a certificate of insurance before you can set foot inside), and use a written contract that covers what happens if the venue internet fails, who supplies the backup connection, and how long the replay stays online. One weather-related outage without a contract clause can cost you a refund and a bad review.',
  },
  {
    title: 'Get listed where couples are already searching',
    body: 'Couples search "wedding livestream near me" and city-level phrases — so being findable locally matters more than a fancy website. Create a Google Business Profile, list in wedding vendor directories, and claim your profile in the WeddingLiveStreaming directory (a Basic listing is free and includes direct messaging with couples). Ask every couple for a review; local rankings are mostly review-driven.',
  },
  {
    title: 'Partner with the vendors who already have the couple',
    body: 'Your fastest-growing referral channels are wedding videographers and photographers who don’t want to run a stream, plus venues and churches that get asked about streaming weekly. Offer videographers a white-label arrangement or referral fee. One venue that recommends you is worth more than any ad campaign.',
  },
  {
    title: 'Systematize the wedding day',
    body: 'Build a repeatable runbook: a venue site-check (or call) for internet and power, arrive 90 minutes early, test the stream link end-to-end, go live 15 minutes before the processional, and have a second connection ready to fail over to. Reliability is the entire product — couples are buying certainty that grandma sees the vows.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How much does it cost to start a wedding livestreaming business?',
    answer:
      'A functional single-operator setup — camera, wireless microphone, tripod, encoder or laptop, and a cellular internet backup — can be assembled for roughly $1,500–$2,500. If you already own videography gear, the incremental cost may be under $800 (mostly the streaming encoder and connectivity). Insurance, an LLC, and a contract template typically add a few hundred dollars a year.',
  },
  {
    question: 'How much can a wedding livestreaming business make?',
    answer:
      'At typical package prices of $500–$1,500 per ceremony, a weekend-only solo operator streaming 30–40 weddings a year grosses roughly $20,000–$50,000, largely on Saturdays. Vendors who add multi-camera packages, reception coverage, and videography bundles push average order values well above $2,000 per event.',
  },
  {
    question: 'Do I need to be a videographer first?',
    answer:
      'No — livestreaming and videography are overlapping but different skills. Livestreaming rewards reliability engineering (connectivity, redundancy, audio) more than cinematic shooting. Many successful stream operators come from AV, church production, esports, or broadcast backgrounds rather than wedding video.',
  },
  {
    question: 'What internet speed do I need to livestream a wedding?',
    answer:
      'A stable 10 Mbps upload comfortably carries a 1080p stream, and 5 Mbps is workable. Stability matters more than speed — always test at the venue beforehand and carry a cellular backup (a hotspot on a different carrier, or a bonded-cellular encoder) because venue Wi-Fi is the most common failure point.',
  },
  {
    question: 'Is wedding livestreaming still in demand?',
    answer:
      'Yes. Livestreaming became a standard wedding line item because guest lists are increasingly spread across states and countries — elderly relatives, overseas family, and friends who can’t travel. Couples now book it proactively alongside photography and videography rather than as a contingency.',
  },
  {
    question: 'How do I get my first paying wedding livestream clients?',
    answer:
      'Three channels work fastest: free directory listings where couples already search (including a free Basic listing on WeddingLiveStreaming), referral partnerships with videographers and venues, and a Google Business Profile with early reviews. A portfolio from two or three free streams plus a published starting price is usually enough to convert the first paid inquiries.',
  },
];

export default function StartABusinessPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Start a Wedding Livestreaming Business"
        description="A practical guide to starting a wedding livestreaming business — startup gear, pricing, first clients, and growth."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Start a Wedding Livestreaming Business', path: '/guides/how-to-start-a-wedding-livestreaming-business' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Business Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Start a Wedding Livestreaming Business
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              To start a wedding livestreaming business, you need about $1,500&ndash;$2,500 in
              gear (camera, wireless mic, encoder, cellular backup), a defined package priced in
              the $500&ndash;$1,500 starting range, two or three portfolio weddings, and
              visibility where couples already search — directories, Google, and venue referral
              partners. The seven steps below take you from zero to booked.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          The seven steps, in order
        </h2>
        <ol className="space-y-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex-none inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Wondering what couples will ask you before booking? Read{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary font-medium hover:underline">
            the questions couples are told to ask their livestreamer
          </Link>{' '}
          — it&rsquo;s the checklist to have confident answers for. And see{' '}
          <Link href="/guides/wedding-live-streaming-cost-by-state" className="text-primary font-medium hover:underline">
            median livestream pricing by state
          </Link>{' '}
          to benchmark your rates against your local market.
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Step five is free — do it today
          </h2>
          <p className="text-muted-foreground mb-8">
            Create a free Basic listing and be visible to couples searching your state. No credit
            card, no commission — upgrade to Featured only when you want top placement.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/submit-listing">List Your Business Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/for-vendors">How the Directory Works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md">
              <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                {item.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
