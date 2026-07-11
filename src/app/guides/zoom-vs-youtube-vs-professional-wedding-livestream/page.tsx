import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Zoom vs. YouTube Live vs. Professional Wedding Streaming Compared',
  description:
    'Zoom is best for interaction, YouTube Live for easy one-way viewing, and a professional service for reliability and quality. A side-by-side comparison of cost, privacy, and guest experience.',
  alternates: { canonical: '/guides/zoom-vs-youtube-vs-professional-wedding-livestream' },
};

const OPTIONS = [
  {
    name: 'Zoom',
    tagline: 'Best for small, interactive gatherings',
    cost: '$0–$17/mo',
    pros: [
      'Remote guests can be seen and heard — toasts, reactions, a virtual receiving line',
      'Familiar to nearly everyone after years of video calls',
      'Free tier works for ceremonies under 40 minutes',
    ],
    cons: [
      'Call-grade video quality — compression visibly degrades a ceremony wide shot',
      'Meetings feel like meetings; someone must admit guests and mute mics',
      'Free 40-minute cap cuts off mid-ceremony unless you upgrade',
    ],
  },
  {
    name: 'YouTube Live',
    tagline: 'Best free one-way broadcast',
    cost: 'Free',
    pros: [
      'Unlimited viewers, no time limit, watchable on any device including smart TVs',
      'Better video quality than Zoom for a one-way stream',
      'Automatic replay stays available after the event',
    ],
    cons: [
      'Unlisted links are private-ish, not private — anyone with the link can watch and reshare',
      'No guest interaction beyond a text chat sidebar',
      'Requires channel setup, and new channels must wait 24 hours before first stream',
    ],
  },
  {
    name: 'Professional service',
    tagline: 'Best quality and reliability',
    cost: '$400–$3,000',
    pros: [
      'Dedicated operator, real cameras, proper audio feed from the officiant or soundboard',
      'Backup internet (bonded cellular) and backup gear — someone accountable if anything fails',
      'Multi-camera switching, private viewing pages, and a polished recording afterward',
    ],
    cons: [
      'The most expensive option by far',
      'Quality varies by vendor — vet them with the right questions before booking',
      'Books up like any wedding vendor; less viable last-minute in smaller markets',
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: 'Which is best overall: Zoom, YouTube Live, or a professional?',
    answer:
      'It depends on what remote guests mean to your day. If a handful of close family need to participate — be seen, give a toast — Zoom wins. If you just need many people to watch reliably for free, YouTube Live wins. If the stream is how a parent or grandparent experiences the wedding, a professional service is worth the money for the reliability alone.',
  },
  {
    question: 'Can I combine these options?',
    answer:
      'Yes, and many couples do. A common setup: a professional (or a capable friend) runs the main broadcast, while a laptop on a Zoom call sits at one reception table so remote family can chat with guests. Some professional vendors will also push their high-quality feed into Zoom or YouTube for you — ask when comparing quotes.',
  },
  {
    question: 'Is YouTube Live private enough for a wedding?',
    answer:
      'An unlisted stream is hidden from search and your channel page, but anyone who has the link can watch it and forward it. For most couples that is private enough. If you want real access control — a password or per-guest links — you need a professional service or a dedicated wedding streaming platform.',
  },
  {
    question: 'What internet speed do all three options need?',
    answer:
      'Plan on at least 5 Mbps of upload speed at the venue, tested at the actual ceremony spot, for any of them. Zoom tolerates a weaker connection by dropping quality; YouTube Live buffers; professionals bring bonded cellular backup so the question largely disappears.',
  },
  {
    question: 'What about Facebook Live or Instagram Live?',
    answer:
      'They work, but with trade-offs: both favor vertical phone video, cap quality lower than YouTube, and tie viewing to having an account — a real obstacle for older relatives. YouTube Live is generally the better free broadcast, because a plain link opens for anyone, on any device, with no login.',
  },
];

export default function ZoomVsYouTubeVsProPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Zoom vs. YouTube Live vs. Professional Wedding Streaming"
        description="Zoom is best for interaction, YouTube Live for easy one-way viewing, and a professional service for reliability and quality — compared on cost, privacy, and guest experience."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Zoom vs. YouTube Live vs. Professional', path: '/guides/zoom-vs-youtube-vs-professional-wedding-livestream' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Comparison</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Zoom vs. YouTube Live vs. Professional Streaming for Weddings
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Use Zoom when remote guests need to participate, YouTube Live when you want a free,
              reliable one-way broadcast anyone can watch, and a professional service ($400–$3,000)
              when quality and reliability matter most — a pro brings real cameras, dedicated audio,
              and backup internet that the free options can&rsquo;t.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-8 max-w-3xl">
          The three options, side by side
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {OPTIONS.map((option) => (
            <div key={option.name} className="rounded-3xl border bg-card p-7 flex flex-col">
              <h3 className="font-display text-xl font-semibold">{option.name}</h3>
              <p className="text-sm text-primary font-medium mt-1">{option.tagline}</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold">Typical cost:</span>{' '}
                <span className="text-muted-foreground">{option.cost}</span>
              </p>
              <div className="mt-5">
                <p className="text-sm font-semibold mb-2">Strengths</p>
                <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
                  {option.pros.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div className="mt-5">
                <p className="text-sm font-semibold mb-2">Limitations</p>
                <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
                  {option.cons.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-8 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">How to decide in one minute</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Start with one question: <span className="font-medium text-foreground">do remote guests
            need to talk back?</span> If a grandparent should be part of the toast or a deployed
            sibling wants to say a few words, that&rsquo;s Zoom — nothing else does two-way well.
          </p>
          <p>
            If watching is enough, the next question is{' '}
            <span className="font-medium text-foreground">how much is riding on it working.</span>{' '}
            A nice-to-have stream for coworkers and distant friends? YouTube Live on a phone and
            tripod is free and fine. The only way an ailing parent experiences your ceremony? That
            stream failing is not an acceptable outcome, and a professional with backup internet and
            backup gear is what removes the risk.
          </p>
          <p>
            Budget-wise, the gap is real: $0–$150 for DIY on either free platform versus $400–$3,000
            professionally. Our{' '}
            <Link href="/guides/wedding-live-streaming-cost" className="text-primary hover:underline">
              cost guide
            </Link>{' '}
            breaks down what each professional tier includes, and the{' '}
            <Link href="/guides/diy-vs-professional-wedding-livestream" className="text-primary hover:underline">
              DIY vs. professional guide
            </Link>{' '}
            goes deeper on the trade-off itself.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Leaning professional?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compare wedding live streaming vendors near your venue and message them directly — free.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Frequently asked questions</h2>
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
