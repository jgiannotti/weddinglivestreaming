import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BadgeEmbedGenerator } from '@/components/badge-embed-generator';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Get Your "Featured On" Vendor Badge',
  description:
    'Listed on WeddingLiveStreaming.com? Add the official "Featured on WeddingLiveStreaming.com" badge to your website — free third-party credibility that links couples straight to your profile.',
  alternates: { canonical: '/vendor-badge' },
};

const FAQ_ITEMS = [
  {
    question: 'Who can use the vendor badge?',
    answer:
      'Any wedding live streaming business with an active profile in the WeddingLiveStreaming.com directory — claimed or not. If your business is listed, you’re welcome to display the badge on your website, email signature, or marketing materials.',
  },
  {
    question: 'Does the badge cost anything?',
    answer:
      'No. The badge is free for every listed vendor, on both free and Featured plans. It’s our way of helping you show couples that you’re part of a vetted national directory.',
  },
  {
    question: 'What if my business isn’t listed yet?',
    answer:
      'Create a free listing first — it takes a few minutes. Once your profile is live, come back to this page, paste your profile URL, and copy your embed code.',
  },
  {
    question: 'Can I resize the badge or change its colors?',
    answer:
      'You can scale the badge to fit your site (it’s an SVG, so it stays crisp at any size), and choose the light or dark version. Please don’t alter the colors, wording, or logo — a consistent badge keeps it recognizable and credible for every vendor who displays it.',
  },
];

export default function VendorBadgePage() {
  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Vendor Badge', path: '/vendor-badge' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      {/* HERO */}
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">For Listed Vendors</p>
            <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl leading-tight">
              Show Couples You&rsquo;re Featured
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Add the official &ldquo;Featured on WeddingLiveStreaming.com&rdquo; badge to your
              website. It&rsquo;s free, takes under a minute, and gives couples researching you one
              more reason to trust you — with a direct link to your directory profile.
            </p>
          </div>
        </div>
      </section>

      {/* GENERATOR */}
      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Get your embed code</h2>
        <BadgeEmbedGenerator />
      </section>

      {/* WHY */}
      <section className="container py-8 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Why display the badge?</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <span className="font-medium text-foreground">Third-party credibility.</span> Couples
            comparing vendors look for outside validation. A recognizable directory badge works the
            same way &ldquo;As seen on The Knot&rdquo; does — it signals you&rsquo;re an established,
            findable business, not just a website.
          </p>
          <p>
            <span className="font-medium text-foreground">More inquiries from your profile.</span>{' '}
            The badge links to your listing, where couples can read about your services and message
            you directly — no commissions, no middleman.
          </p>
          <p>
            <span className="font-medium text-foreground">It helps every vendor in the directory.</span>{' '}
            Each badge on a real wedding-industry website makes the directory more visible in search
            results, which brings more couples to every profile — including yours.
          </p>
        </div>
      </section>

      {/* NOT LISTED CTA */}
      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">Not listed yet?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Create your free listing, then come back for your badge.
          </p>
          <Button asChild size="lg">
            <Link href="/submit-listing">List Your Business Free</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Badge FAQs</h2>
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
