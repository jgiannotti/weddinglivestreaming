import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Should You Livestream Your Wedding Reception?',
  description:
    'Most couples stream the ceremony only — and that’s usually right. When reception coverage is worth it, what to stream (toasts and first dance), and how long a wedding livestream should run.',
  alternates: { canonical: '/guides/should-you-livestream-your-wedding-reception' },
};

const MOMENTS = [
  {
    title: 'The toasts',
    body: 'The single most-requested reception moment for remote guests — speeches are the part of a reception that translates perfectly to a screen. If you stream nothing else after the ceremony, stream the toasts. They’re also the moment where professional audio matters most: a toast captured from across a loud room is unwatchable.',
  },
  {
    title: 'First dance and parent dances',
    body: 'Short, emotional, and scheduled — ideal for a stream window. Grandparents who couldn’t travel routinely rank the father-daughter or mother-son dance alongside the vows.',
  },
  {
    title: 'Cake cutting and grand exit',
    body: 'Nice-to-have bookends if the stream is already running. Neither justifies extra coverage hours on its own, but both are easy inclusions in a "key moments" reception package.',
  },
  {
    title: 'What not to stream: the open dance floor',
    body: 'Two hours of dark dance floor with loud music is where remote viewers drop off — and where guests most want to be off camera. A produced stream ends after the scheduled moments; nobody misses the part that got cut.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Should we livestream the reception or just the ceremony?',
    answer:
      'Ceremony-only is the right default — it’s the moment remote guests genuinely can’t miss, and most packages price it that way. Add reception coverage when specific far-away people would care about the toasts and first dance, which are the reception moments that translate best to a screen. Full-night coverage of an open dance floor rarely rewards anyone.',
  },
  {
    question: 'How long should a wedding livestream be?',
    answer:
      'A ceremony stream typically runs 45–90 minutes: it goes live 10–15 minutes before the processional and ends shortly after the recessional. Adding reception key moments (toasts, first dance, cake cutting) usually extends coverage by one to two hours, often as a separate stream window rather than one continuous broadcast through cocktail hour.',
  },
  {
    question: 'How much does it cost to add reception coverage to a livestream?',
    answer:
      'Vendors usually price reception coverage as additional hours on top of a ceremony package — commonly a few hundred dollars for a toasts-and-first-dance window, more for continuous multi-hour coverage. Ask whether the quote includes an operator staying through the reception or an unmanned camera, and whether the toasts get a dedicated microphone feed.',
  },
  {
    question: 'Do remote guests actually watch the reception stream?',
    answer:
      'They watch the scheduled moments. Viewer counts on real weddings spike for the toasts and first dance and fall off steeply during open dancing. That pattern is exactly why "key moments" reception coverage exists as a package: it keeps the parts people watch and drops the hours they don’t.',
  },
  {
    question: 'Should the reception stream use the same link as the ceremony?',
    answer:
      'Yes, whenever possible — one link for the whole wedding day is dramatically easier for remote guests, especially older ones. If there will be a gap between ceremony and reception coverage, have the stream show a title card with the return time rather than ending, so guests don’t think the link is dead.',
  },
];

export default function ReceptionPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Should You Livestream Your Wedding Reception?"
        description="When reception coverage is worth it, which moments to stream, and how long a wedding livestream should run."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Livestreaming the Reception', path: '/guides/should-you-livestream-your-wedding-reception' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Coverage Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Should You Livestream Your Wedding Reception?
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Stream the ceremony; add the reception only for its key moments. Toasts and the
              first dance are what remote guests actually watch — the open dance floor is where
              they tune out and in-person guests want cameras gone. Here&rsquo;s what earns a
              spot in the stream, what it adds to the cost, and how to structure the timing.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Reception moments, ranked for remote guests
        </h2>
        <div className="space-y-6">
          {MOMENTS.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Still deciding on the stream itself? Start with{' '}
          <Link href="/guides/is-a-wedding-livestream-worth-it" className="text-primary font-medium hover:underline">
            whether a livestream is worth it
          </Link>{' '}
          and{' '}
          <Link href="/guides/wedding-live-streaming-cost" className="text-primary font-medium hover:underline">
            what it costs
          </Link>
          . Booking a vendor? Ask about reception hours using{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary font-medium hover:underline">
            the vetting checklist
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Compare ceremony and reception packages
          </h2>
          <p className="text-muted-foreground mb-8">
            Vendors list what their packages cover — message them directly about toasts-and-dances
            add-ons. Free for couples.
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
