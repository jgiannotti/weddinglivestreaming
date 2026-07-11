import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Live Streaming Cost: What You’ll Actually Pay in 2026',
  description:
    'Professional wedding live streaming costs $400–$3,000, while DIY runs $0–$150. See a full pricing breakdown by service tier and what drives the cost up or down.',
  alternates: { canonical: '/guides/wedding-live-streaming-cost' },
};

const FAQ_ITEMS = [
  {
    question: 'What is the average cost of wedding live streaming?',
    answer:
      'Most couples who hire a professional pay between $400 and $1,200 for a single-camera package with an operator. Multi-camera productions with editing and highlight reels run $1,200–$3,000. DIY setups using your own phone and a streaming app cost $0–$150, mostly for a tripod and a stable connection.',
  },
  {
    question: 'Is wedding live streaming worth the money?',
    answer:
      'If you have guests who genuinely cannot travel — deployed family, elderly relatives, health restrictions — yes, it’s one of the best-value line items in a wedding budget. If it’s more of a nice-to-have, a DIY setup or asking a tech-savvy friend to run a phone on a tripod is a perfectly reasonable way to save the money for something else.',
  },
  {
    question: 'Do photographers or videographers also offer live streaming?',
    answer:
      'Some do, either as an add-on or a referral to a specialist. Ask your videographer directly — but know that live streaming requires different gear (encoders, dedicated upload bandwidth) than event videography, so a vendor who streams as a side service isn’t always as reliable as one who does it full-time.',
  },
  {
    question: 'What’s included in a typical $800 wedding livestream package?',
    answer:
      'At that price you should expect one operator, one to two cameras, a dedicated audio feed (not just the camera’s built-in mic), a private link sent to your guest list, and coverage of the ceremony. Reception coverage, multi-camera switching, and a downloadable recording are common add-ons above this tier.',
  },
  {
    question: 'Are there hidden costs I should ask about?',
    answer:
      'Travel fees for venues more than 30–50 miles from the vendor, rush turnaround for the recorded file, extra hours if the ceremony runs long, and access fees if you want the recording to stay live longer than 30–90 days are the most common extras. Always ask for an itemized quote before booking.',
  },
];

export default function WeddingLiveStreamingCostPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Wedding Live Streaming Cost: What You'll Actually Pay"
        description="Professional wedding live streaming costs $400-$3,000, while DIY runs $0-$150. A full pricing breakdown by service tier."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Wedding Live Streaming Cost', path: '/guides/wedding-live-streaming-cost' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Cost Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How Much Does Wedding Live Streaming Cost?
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Professional wedding live streaming typically costs $400–$3,000, with most couples
              paying around $800–$1,200 for a single-camera package with an operator. DIY setups
              using your own phone and a streaming app cost $0–$150. The median professional
              booking lands close to $900.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Pricing by service tier</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Prices vary by region, season, and how much of the day you want covered, but the market
          generally breaks into four tiers. Use this as a starting point for budgeting, then get a
          quote from a couple of vendors in your area to see how local pricing compares.
        </p>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left font-semibold p-4">Tier</th>
                <th className="text-left font-semibold p-4">Typical price</th>
                <th className="text-left font-semibold p-4">What&rsquo;s included</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4 font-medium align-top">DIY app</td>
                <td className="p-4 align-top whitespace-nowrap">$0–$150</td>
                <td className="p-4 align-top text-muted-foreground">
                  Your own phone or tablet, a basic tripod, and a free or low-cost streaming app
                  (Zoom, Facebook Live, or a dedicated wedding streaming app). No operator — a
                  friend or family member hits record.
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Single-camera basic</td>
                <td className="p-4 align-top whitespace-nowrap">$400–$900</td>
                <td className="p-4 align-top text-muted-foreground">
                  One professional operator, one camera, dedicated audio pickup, a private streaming
                  link for guests. Usually covers the ceremony only.
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Multi-camera professional</td>
                <td className="p-4 align-top whitespace-nowrap">$900–$2,000</td>
                <td className="p-4 align-top text-muted-foreground">
                  Two or more cameras with live switching, a dedicated audio mix, ceremony plus
                  toasts/first dance, and typically a downloadable recording afterward.
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium align-top">Premium / cinematic</td>
                <td className="p-4 align-top whitespace-nowrap">$1,500–$3,000+</td>
                <td className="p-4 align-top text-muted-foreground">
                  Full production crew, multiple camera angles with cinematic switching, professional
                  lighting and audio, extended coverage of the full event, and a polished highlight
                  reel edited afterward.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          For comparison, virtual-coordination services that handle the tech logistics around your
          existing videographer (rather than providing the camera crew themselves) tend to run
          around $1,200.
        </p>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">What affects the price</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The single biggest driver is the number of cameras. One camera and one operator is the
            baseline; every additional angle adds a second operator (or a more complex fixed-camera
            rig) plus the equipment and skill needed to switch between feeds live. That switching —
            cutting smoothly between a wide shot of the aisle and a close-up of your vows — is what
            separates a $500 booking from a $1,500 one.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Travel matters too. Most vendors quote a free radius (often 20–30 miles) and then charge
            mileage or a flat travel fee beyond it, which adds up fast for destination weddings.
            Length of coverage is another factor: a ceremony-only stream is cheaper than covering the
            full day from processional through last dance, since it&rsquo;s simply more hours of an
            operator&rsquo;s time.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Finally, add-ons move the price. A downloadable recording, an edited highlight reel, an
            extended access window for guests who couldn&rsquo;t watch live, or a rush turnaround all
            typically cost extra on top of the base package. Ask for these upfront so your quote
            reflects everything you actually want.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">DIY vs. hiring a pro</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          DIY is genuinely fine for a small, casual wedding where the goal is just letting a few
          relatives watch from home. A phone on a tripod, propped up in the back of the room and
          connected to a stable Wi-Fi or hotspot, will get the job done for free or close to it. The
          tradeoff is real: audio will likely be thin, there&rsquo;s no one adjusting the shot as you
          move around, and if the connection drops, no one is watching to fix it.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Hiring a professional makes sense once the stream actually matters — a grandparent who
          can&rsquo;t travel, a sibling stationed overseas, or a guest list large enough that you want
          it done right. A pro brings a dedicated audio setup so vows are actually audible, a backup
          connection in case the venue&rsquo;s Wi-Fi fails, and someone whose only job that day is
          making sure the stream stays up — so you&rsquo;re not the one troubleshooting a dropped
          connection in your wedding dress.
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Ready to get real quotes?</h2>
          <p className="text-muted-foreground mb-8">
            Browse live streaming vendors in your area and message them directly to compare pricing.
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
