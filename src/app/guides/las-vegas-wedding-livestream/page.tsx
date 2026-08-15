import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Las Vegas Wedding Livestreams: Chapels, Elopements & Cost',
  description:
    'How to livestream a Las Vegas wedding — which chapels stream ceremonies, what it costs, and how to get family watching a spontaneous or planned Vegas wedding from anywhere.',
  alternates: { canonical: '/guides/las-vegas-wedding-livestream' },
};

const POINTS = [
  {
    title: 'Vegas weddings are what livestreaming was made for',
    body: 'More couples marry in Las Vegas than anywhere else in America, and by design many of those weddings happen fast — which means parents, grandparents, and friends often can\'t be there in person. A livestream turns a two-witness chapel ceremony into one the whole family attends. It\'s the single most common reason Vegas chapels added streaming.',
  },
  {
    title: 'Many chapels have streaming built in — ask before you book',
    body: 'The famous chapels — Graceland Wedding Chapel, Little Church of the West, Vegas Weddings, Little Chapel and their peers — largely offer livestreaming as a package add-on, using installed cameras and staff who stream ceremonies every day. If you\'re marrying at a chapel, ask three things: is the stream included or an add-on, is it private or posted publicly, and how long does the replay stay up.',
  },
  {
    title: 'Marrying outside a chapel? Bring a vendor',
    body: 'For weddings at Vegas hotels, golf clubs, the desert, or an Airbnb, chapel streaming doesn\'t apply — that\'s when you hire an independent livestream vendor. Nevada vendors in our directory list their coverage and starting prices, and many travel throughout the Vegas valley including Red Rock and dry-lake-bed ceremonies.',
  },
  {
    title: 'The time-zone math matters more than usual',
    body: 'A 6 PM Pacific ceremony is 9 PM in New York and 2 AM in London — and spontaneous Vegas weddings often give guests only days of notice. Send the stream link the moment you have it, always with the time zone spelled out, and confirm the replay link for everyone who\'ll be asleep. Our invitation wording guide has copy-paste templates that handle exactly this.',
  },
  {
    title: 'What it costs in Nevada',
    body: 'Chapel streaming add-ons commonly run well under the price of an independent vendor because the equipment is fixed and the ceremony is short. Independent professional coverage in Nevada starts in the same range as most states — our cost-by-state data page lists the current Nevada median from published vendor pricing.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can you livestream a Las Vegas chapel wedding?',
    answer:
      'Yes — most well-known Las Vegas chapels offer livestreaming as a built-in package option, streamed by chapel staff on installed cameras. Ask whether the stream is private or public, whether it\'s included or an add-on, and how long the replay stays available. For ceremonies outside a chapel, an independent livestream vendor covers hotels, outdoor venues, and desert ceremonies.',
  },
  {
    question: 'How much does it cost to livestream a Vegas wedding?',
    answer:
      'Chapel streaming add-ons are typically the cheapest professional option since the equipment is permanently installed. Hiring an independent vendor for a non-chapel venue runs closer to typical professional rates — nationally most packages start between $600 and $1,500. Nevada-specific medians from published vendor pricing are on our cost-by-state page.',
  },
  {
    question: 'How do guests watch a Las Vegas wedding online?',
    answer:
      'The couple (or chapel) shares a private link; guests open it in any browser — no app or account. Because Vegas ceremonies often happen on short notice across time zones, send the link immediately, state the time zone, and point night-time viewers to the replay. Our guest guide covers joining, fixing playback problems, and watching on a TV.',
  },
  {
    question: 'Do Elvis weddings get livestreamed?',
    answer:
      'Constantly — themed ceremonies are among the most-watched wedding streams because remote guests genuinely don\'t want to miss them. Themed chapels treat streaming as a standard add-on; just confirm whether the performance rights music in the ceremony affects a public replay (private links avoid the issue entirely).',
  },
];

export default function VegasGuidePage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Las Vegas Wedding Livestreams: Chapels, Elopements & Cost"
        description="Which Vegas chapels stream ceremonies, what livestreaming costs in Nevada, and how remote family watches a spontaneous Vegas wedding."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Las Vegas Wedding Livestreams', path: '/guides/las-vegas-wedding-livestream' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Destination Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Las Vegas Wedding Livestreams
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              To livestream a Las Vegas wedding: if you&rsquo;re marrying at a chapel, most offer
              streaming as a package add-on — ask for a private link and replay. If you&rsquo;re
              marrying anywhere else, book an independent Nevada livestream vendor. Either way,
              spell out the time zone for far-away guests and share the replay link, because a
              Vegas ceremony at 6 PM Pacific is the middle of the night for half the family.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          What makes Vegas different
        </h2>
        <div className="space-y-6">
          {POINTS.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Planning the details? See{' '}
          <Link href="/guides/wedding-live-streaming-cost-by-state" className="text-primary font-medium hover:underline">
            Nevada pricing in the cost-by-state data
          </Link>
          ,{' '}
          <Link href="/guides/wedding-livestream-invitation-wording" className="text-primary font-medium hover:underline">
            short-notice invitation wording
          </Link>
          , and{' '}
          <Link href="/guides/how-to-watch-a-wedding-livestream" className="text-primary font-medium hover:underline">
            the guest guide for watching from anywhere
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Find Nevada livestream vendors
          </h2>
          <p className="text-muted-foreground mb-8">
            Chapels and independent vendors serving Las Vegas — compare and message them free.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/wedding-live-streaming-nevada">Browse Nevada Vendors</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/wedding-live-streaming-nevada/las-vegas">Las Vegas Vendors</Link>
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
