import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'DIY vs. Professional Wedding Live Streaming: Which Should You Choose?',
  description:
    'A side-by-side comparison of DIY streaming apps versus hiring a professional wedding livestream vendor — cost, audio quality, reliability, and who each option is really for.',
  alternates: { canonical: '/guides/diy-vs-professional-wedding-livestream' },
};

const FAQ_ITEMS = [
  {
    question: 'Is DIY wedding live streaming actually reliable?',
    answer:
      'It can be, for a small ceremony with a strong internet connection and someone dedicated to watching the stream throughout. The risk is that DIY setups have no backup — if the connection drops or the app crashes, there’s no second system already running to catch the gap.',
  },
  {
    question: 'What do professional vendors offer that a DIY app doesn’t?',
    answer:
      'The two biggest differences are dedicated audio (a mic near the officiant, not a phone mic across the room) and a backup plan — a second camera, a second internet connection, or both — so a single failure doesn’t take the whole stream down. You also get someone whose only job is running the stream, rather than a relative who’s also trying to enjoy the wedding.',
  },
  {
    question: 'Can I use a DIY app and still get decent quality?',
    answer:
      'Yes, with the right setup: a tripod (not handheld), an external microphone rather than the built-in one, and a wired or strong hotspot connection instead of shared venue Wi-Fi. It won’t match a multi-camera professional production, but it will be a clear improvement over a phone propped against a chair.',
  },
  {
    question: 'How do I decide between DIY and hiring someone?',
    answer:
      'Ask how many people are watching remotely and how much it would matter if they missed it. A handful of guests watching a casual backyard ceremony is low-stakes DIY territory. A large remote audience, a family member who absolutely cannot miss the vows, or a venue with unreliable Wi-Fi all tip the scale toward hiring a professional.',
  },
  {
    question: 'Do professional vendors also handle the recording afterward?',
    answer:
      'Most do, usually as part of the package or as a low-cost add-on. DIY apps like Zoom and Facebook Live can also save a recording, though the quality and audio will reflect whatever was captured live — there’s no editing pass afterward unless you do it yourself.',
  },
];

export default function DiyVsProfessionalPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="DIY vs. Professional Wedding Live Streaming: Which Should You Choose?"
        description="A side-by-side comparison of DIY streaming apps versus hiring a professional wedding livestream vendor."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'DIY vs. Professional', path: '/guides/diy-vs-professional-wedding-livestream' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Comparison Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            DIY vs. Professional Wedding Live Streaming
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              DIY streaming apps are free to $150 and fine for small, casual weddings with a
              reliable connection. Professional vendors cost $400–$3,000 and are worth it when the
              stream genuinely matters — a large remote audience, a can&rsquo;t-miss moment, or a
              venue you can&rsquo;t risk having spotty Wi-Fi.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Side-by-side comparison</h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left font-semibold p-4">Factor</th>
                <th className="text-left font-semibold p-4" data-affiliate-slot="diy-app">
                  DIY streaming app
                </th>
                <th className="text-left font-semibold p-4">Professional vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4 font-medium align-top">Cost</td>
                <td className="p-4 align-top text-muted-foreground" data-affiliate-slot="diy-app">
                  $0–$150 (mostly tripod and accessories)
                </td>
                <td className="p-4 align-top text-muted-foreground">$400–$3,000 depending on tier</td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Audio quality</td>
                <td className="p-4 align-top text-muted-foreground">
                  Built-in mic only, unless you add an external one — often thin or hard to hear
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  Dedicated mic near the officiant, mixed into the feed for clear vows
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Camera angles</td>
                <td className="p-4 align-top text-muted-foreground">
                  Usually one static angle from a tripod
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  One to several angles, often with live switching between them
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Reliability / backup</td>
                <td className="p-4 align-top text-muted-foreground">
                  No backup — a dropped connection or crashed app ends the stream
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  Backup connection and/or second camera, actively monitored throughout
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Guest experience</td>
                <td className="p-4 align-top text-muted-foreground">
                  Functional but basic — like watching a home video call
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  Closer to watching a produced broadcast, especially with multi-camera
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Who should choose this</td>
                <td className="p-4 align-top text-muted-foreground">
                  Small, casual weddings; tight budgets; a few remote guests who just want to feel
                  included
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  Larger weddings, guests who truly can&rsquo;t miss it, or couples who want the
                  stream to look and sound genuinely good
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Being honest about the tradeoff</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            There&rsquo;s no wrong answer here — it comes down to what&rsquo;s actually at stake.
            DIY streaming apps have gotten genuinely good, and for a small backyard wedding or an
            intimate ceremony where a handful of relatives just want to feel included from afar, a
            phone on a tripod running a free app is a completely reasonable choice. You&rsquo;ll save
            the money and, if the connection holds, most remote guests will be happy just to have
            been able to watch at all.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Professional streaming earns its cost when the moment is one you truly cannot afford to
            lose — a parent who can&rsquo;t travel, a sibling deployed overseas, or a wedding large
            enough that dozens of people are counting on the stream working. Paying for a dedicated
            operator, real audio, and a backup plan isn&rsquo;t about luxury at that point; it&rsquo;s
            about making sure the people who matter don&rsquo;t miss it because of a dropped Wi-Fi
            signal.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Not sure which way to go?</h2>
          <p className="text-muted-foreground mb-8">
            Browse professional vendors near you and get a quote — it costs nothing to compare.
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
