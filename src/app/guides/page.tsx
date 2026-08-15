import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreadcrumbJsonLd, PagesItemListJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Live Streaming Guides',
  description:
    'Everything couples need to know about live streaming a wedding — real costs, DIY vs. professional, platform comparisons, church ceremonies, and how to vet a vendor.',
  alternates: { canonical: '/guides' },
};

const GUIDES = [
  {
    eyebrow: 'Original Data',
    title: 'Average Wedding Live Streaming Cost by State',
    description:
      'Real published pricing from 65 vendors across 28 states — median starting prices, full ranges, and which states are cheapest, from our own directory data.',
    href: '/guides/wedding-live-streaming-cost-by-state',
  },
  {
    eyebrow: 'Cost Guide',
    title: 'How Much Does Wedding Live Streaming Cost?',
    description:
      'Professional packages run $400–$3,000; DIY runs $0–$150. A full pricing breakdown by service tier and what drives the price up or down.',
    href: '/guides/wedding-live-streaming-cost',
  },
  {
    eyebrow: 'How-To Guide',
    title: 'How to Live Stream a Wedding',
    description:
      'A step-by-step walkthrough of streaming your own ceremony — platform choice, gear, internet, audio, and a day-of checklist.',
    href: '/guides/how-to-live-stream-a-wedding',
  },
  {
    eyebrow: 'Comparison',
    title: 'DIY vs. Professional Wedding Livestream',
    description:
      'An honest comparison of doing it yourself versus hiring a pro — quality, reliability, cost, and who each option actually suits.',
    href: '/guides/diy-vs-professional-wedding-livestream',
  },
  {
    eyebrow: 'Comparison',
    title: 'Zoom vs. YouTube Live vs. Professional Streaming',
    description:
      'The three most common ways couples stream a wedding, compared on quality, guest experience, privacy, and cost.',
    href: '/guides/zoom-vs-youtube-vs-professional-wedding-livestream',
  },
  {
    eyebrow: 'Venue Guide',
    title: 'How to Live Stream a Church Wedding',
    description:
      'Navigating venue permission, camera placement rules, audio in echoing spaces, and connectivity inside older church buildings.',
    href: '/guides/how-to-livestream-a-church-wedding',
  },
  {
    eyebrow: 'Vendor Guide',
    title: 'Questions to Ask Your Wedding Live Streamer',
    description:
      'The ten questions that separate an experienced live streaming specialist from a side hustle — backups, audio, cameras, and pricing.',
    href: '/guides/questions-to-ask-your-wedding-livestreamer',
  },
  {
    eyebrow: 'Etiquette Guide',
    title: 'Wedding Livestream Invitation Wording',
    description:
      'Copy-paste wording templates for telling guests about your livestream — formal insert cards, wedding websites, emails, and day-of reminder texts.',
    href: '/guides/wedding-livestream-invitation-wording',
  },
  {
    eyebrow: 'Guest Guide',
    title: 'How to Watch a Wedding Livestream',
    description:
      'For remote guests: how to join on any phone, tablet, computer, or TV — and the one-minute fix for every common problem.',
    href: '/guides/how-to-watch-a-wedding-livestream',
  },
  {
    eyebrow: 'Decision Guide',
    title: 'Is a Wedding Livestream Worth It?',
    description:
      'An honest look at when a livestream is worth paying for, when DIY is fine, and when to skip it entirely.',
    href: '/guides/is-a-wedding-livestream-worth-it',
  },
  {
    eyebrow: 'Music & Copyright',
    title: 'Wedding Livestream Music & Copyright',
    description:
      'Why YouTube and Facebook mute wedding streams over music, which platforms are safer, and how to keep your songs without losing the replay.',
    href: '/guides/wedding-livestream-music-copyright',
  },
  {
    eyebrow: 'Coverage Guide',
    title: 'Should You Livestream Your Wedding Reception?',
    description:
      'Ceremony-only is the right default — when toasts and first-dance coverage earn their cost, and what remote guests actually watch.',
    href: '/guides/should-you-livestream-your-wedding-reception',
  },
  {
    eyebrow: 'Destination Guide',
    title: 'Las Vegas Wedding Livestreams',
    description:
      'Which chapels stream ceremonies, what it costs in Nevada, and how far-away family watches a short-notice Vegas wedding.',
    href: '/guides/las-vegas-wedding-livestream',
  },
  {
    eyebrow: 'Venue Guide',
    title: 'How to Livestream an Outdoor Wedding',
    description:
      'No venue Wi-Fi, wind on the mics, sun behind the couple — solving the four problems that make outdoor and beach weddings the hardest streams.',
    href: '/guides/how-to-livestream-an-outdoor-wedding',
  },
  {
    eyebrow: 'Equipment Guide',
    title: 'Wedding Livestream Equipment: What You Actually Need',
    description:
      'Three honest equipment tiers — a $150 phone setup, a $2,500 prosumer kit, and what the pros bring — plus the two mistakes that sink most streams.',
    href: '/guides/wedding-livestream-equipment',
  },
  {
    eyebrow: 'Business Guide',
    title: 'How to Start a Wedding Livestreaming Business',
    description:
      'Startup gear under $2,500, what to charge, how to land your first clients, and the runbook that keeps streams reliable.',
    href: '/guides/how-to-start-a-wedding-livestreaming-business',
  },
];

export default function GuidesIndexPage() {
  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ]}
      />
      <PagesItemListJsonLd items={GUIDES.map((g) => ({ name: g.title, path: g.href }))} />

      {/* HERO */}
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">Learn</p>
            <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl leading-tight">
              Wedding Live Streaming Guides
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Straight answers about streaming your wedding — what it costs, how to do it yourself,
              when to hire a professional, and how to choose one you can trust.
            </p>
          </div>
        </div>
      </section>

      {/* GUIDE CARDS */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GUIDES.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group rounded-3xl border bg-card p-7 md:p-8 transition-shadow hover:shadow-md flex flex-col"
            >
              <p className="eyebrow mb-3">{guide.eyebrow}</p>
              <h2 className="font-display text-xl md:text-2xl font-medium mb-3 group-hover:text-primary transition-colors">
                {guide.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed flex-1">{guide.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read the guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
            Ready to find a vendor?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Browse professional wedding live streaming vendors by state and city, and message them
            directly — free.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse the Directory</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
