import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Is a Wedding Livestream Worth It? An Honest Look',
  description:
    'Whether a wedding livestream is worth it comes down to one question: who can’t be there? An honest look at when it’s worth paying for, when DIY is fine, and when to skip it.',
  alternates: { canonical: '/guides/is-a-wedding-livestream-worth-it' },
};

const WORTH_IT = [
  {
    title: 'Grandparents or elderly relatives can’t travel',
    body: 'This is the single most common reason couples book a stream — and the one nobody regrets. For a grandparent who physically can’t make the trip, watching the vows live (not a recording weeks later) is the difference between attending and missing it.',
  },
  {
    title: 'You have significant family overseas or across the country',
    body: 'When ten or more invited guests can’t realistically attend — military deployments, visa issues, cross-country family, new parents who can’t fly — a stream turns your “sorry we’ll miss it” list into an audience.',
  },
  {
    title: 'You’re having a small or destination wedding',
    body: 'Micro-weddings and destination ceremonies keep the in-person list tiny by design. A livestream lets you keep the intimate wedding you want without cutting everyone else out of the moment entirely.',
  },
  {
    title: 'Someone important is immunocompromised or in care',
    body: 'For guests in hospitals, care facilities, or with health conditions that make travel or crowds risky, a stream is often the only way to include them — and staff are usually glad to help them watch.',
  },
];

const MAYBE_NOT = [
  {
    title: 'Everyone you love can be in the room',
    body: 'If your full guest list is local and able-bodied, a stream adds cost and a camera presence for an audience that doesn’t exist. Put the money toward the videographer instead.',
  },
  {
    title: 'You’d only do it “because people do it now”',
    body: 'A stream with three viewers is a real cost for little joy. Count the people who would actually watch live before deciding — if it’s fewer than a handful, a next-day highlight video serves them better.',
  },
  {
    title: 'Your venue genuinely can’t support it',
    body: 'A remote barn with no cell coverage and no internet can defeat even professional bonded-cellular setups. A good vendor will tell you honestly after a venue check — if the connectivity truly isn’t there, a recorded video is the reliable choice.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is a wedding livestream worth the money?',
    answer:
      'It’s worth it when specific people you love cannot attend — elderly grandparents, overseas family, guests with health constraints. It’s not about the technology; it’s about whether there’s a real audience. Couples who stream for even one grandparent almost universally say it was worth it, while couples who streamed “just in case” often find few people watched.',
  },
  {
    question: 'How much does a wedding livestream cost?',
    answer:
      'Professional wedding livestream packages typically start between $500 and $1,500 for a single-operator ceremony stream, with multi-camera productions running higher. DIY on a phone tripod is nearly free but carries real reliability risk. See our cost guide and state-by-state price data for detailed numbers.',
  },
  {
    question: 'Is a livestream a replacement for a wedding videographer?',
    answer:
      'No — they do different jobs. A livestream is for the people who can’t be there on the day; a videographer produces a polished keepsake film. Many vendors offer both together at a discount, and the livestream recording can double as a raw archive, but a stream is not a cinematic wedding film.',
  },
  {
    question: 'Can I just have a friend livestream my wedding on their phone?',
    answer:
      'You can, and for a casual backyard wedding it may be fine. The risks are real though: shaky framing, unusable audio from across the room, a dead battery, or venue Wi-Fi dropping mid-vows — with no second chance. If the remote viewers matter deeply (a grandparent’s only way to attend), reliability is what you’re actually paying a professional for.',
  },
  {
    question: 'Do guests actually watch wedding livestreams?',
    answer:
      'Yes — when the invitation is handled well. Streams announced on the wedding website, with a reminder text the morning of and a clear start time with time zone, routinely draw dozens of live viewers plus replay watchers. Streams with a buried link and no reminders get a handful.',
  },
];

export default function WorthItPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Is a Wedding Livestream Worth It? An Honest Look"
        description="When a wedding livestream is worth paying for, when DIY is fine, and when to skip it entirely."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Is a Livestream Worth It?', path: '/guides/is-a-wedding-livestream-worth-it' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Decision Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Is a Wedding Livestream Worth It?
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              A wedding livestream is worth it when specific people you love can&rsquo;t be in
              the room — a grandparent who can&rsquo;t travel, family overseas, a friend in the
              hospital. It&rsquo;s usually not worth it when your whole guest list can attend in
              person. The honest breakdown below covers both sides, what it costs, and the DIY
              middle ground.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          When it&rsquo;s clearly worth it
        </h2>
        <div className="space-y-6">
          {WORTH_IT.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 max-w-3xl border-t">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          When you can probably skip it
        </h2>
        <div className="space-y-6">
          {MAYBE_NOT.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Landed on &ldquo;worth it&rdquo;? Your next decisions are{' '}
          <Link href="/guides/diy-vs-professional-wedding-livestream" className="text-primary font-medium hover:underline">
            DIY vs. hiring a professional
          </Link>{' '}
          and what it will cost —{' '}
          <Link href="/guides/wedding-live-streaming-cost" className="text-primary font-medium hover:underline">
            typical pricing
          </Link>{' '}
          and{' '}
          <Link href="/guides/wedding-live-streaming-cost-by-state" className="text-primary font-medium hover:underline">
            median prices in your state
          </Link>
          . Then use{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary font-medium hover:underline">
            the vetting checklist
          </Link>{' '}
          before you book anyone.
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            See what a pro would cost near you
          </h2>
          <p className="text-muted-foreground mb-8">
            Browse vendors in your state, compare published starting prices, and message them
            directly — free, with no booking fees.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
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
