import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'FAQ — Wedding Live Streaming Directory',
  description:
    'Common questions about WeddingLiveStreaming.com — free vendor search for couples, listing options for vendors, and quick answers about livestream planning.',
  alternates: { canonical: '/faq' },
};

const FAQ_ITEMS = [
  {
    section: 'For Couples',
    items: [
      { q: 'Is it free to use?', a: 'Yes — completely free for couples. We never charge you, take a commission, or add booking fees. Vendors pay nothing to list, or a small monthly fee for premium placement.' },
      { q: 'How do I contact a vendor?', a: 'Find a vendor you like, click "Message Vendor," and send them a note. The vendor will respond directly to your email. No middleman.' },
      { q: 'Do I need to create an account?', a: 'You\'ll need a quick account to send messages — this prevents spam for our vendors. Sign-up takes 30 seconds.' },
      { q: 'How do I know vendors are legit?', a: 'Every vendor has a complete profile with a real business, location, and contact info. We review new listings before they go live, and you can report anything suspicious right from the listing page.' },
    ],
  },
  {
    section: 'Planning Your Livestream',
    items: [
      {
        q: 'How much does wedding live streaming cost?',
        a: 'Professional packages typically start between $500 and $1,500 for a single-operator ceremony stream, with multi-camera productions running higher. We publish median starting prices for every state, computed from vendor pricing in this directory — see the cost guide and the cost-by-state data page in our guides.',
      },
      {
        q: 'Should we hire a professional or DIY the stream?',
        a: 'DIY on a phone tripod works for casual, low-stakes streams; a professional brings backup internet, dedicated microphones, and an operator — reliability that matters when a grandparent\'s only way to attend is the stream. Our DIY vs. professional guide walks through the honest trade-offs.',
      },
      {
        q: 'What should we ask a vendor before booking?',
        a: 'The big four: their backup plan for internet and equipment failure, how many cameras are included, how they capture audio during the vows, and exactly what the price includes. Our vetting checklist covers all ten questions worth asking.',
      },
      {
        q: 'How do we tell guests about the livestream?',
        a: 'Put the link on your wedding website (not the paper invite), always include the start time with a time zone, and send a reminder text the morning of. Our invitation wording guide has copy-paste templates for insert cards, websites, emails, and texts.',
      },
    ],
  },
  {
    section: 'For Vendors',
    items: [
      { q: 'How long does my listing stay up?', a: '12 months from the date your listing is approved. We\'ll email you before it expires so you can renew.' },
      { q: 'What\'s the difference between Basic and Featured?', a: 'Basic is free forever with a full profile and direct messaging. Featured ($29/mo or $199/yr) puts you at the top of search results, gives you a gold badge, and includes a spot in the homepage spotlight.' },
      { q: 'Can I cancel Featured anytime?', a: 'Yes — cancel from your dashboard. Your listing reverts to Basic at the end of your billing period.' },
      { q: 'Are there commission fees on bookings?', a: 'Never. Whatever you charge a couple, you keep 100% of it. The monthly fee is the only cost.' },
    ],
  },
];

// Guide links rendered under the planning section — kept out of the FAQ answer
// strings so the JSON-LD stays clean plain text.
const PLANNING_LINKS = [
  { label: 'What livestreaming costs (+ by state)', href: '/guides/wedding-live-streaming-cost' },
  { label: 'DIY vs. professional', href: '/guides/diy-vs-professional-wedding-livestream' },
  { label: 'Questions to ask a vendor', href: '/guides/questions-to-ask-your-wedding-livestreamer' },
  { label: 'Invitation wording templates', href: '/guides/wedding-livestream-invitation-wording' },
  { label: 'All guides', href: '/guides' },
];

export default function FAQPage() {
  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ]}
      />
      <FaqJsonLd
        items={FAQ_ITEMS.flatMap((s) => s.items.map((i) => ({ question: i.q, answer: i.a })))}
      />

      <div className="text-center mb-12">
        <p className="eyebrow mb-3">FAQ</p>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl">Frequently Asked Questions</h1>
      </div>

      {FAQ_ITEMS.map((section) => (
        <div key={section.section} className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-6">{section.section}</h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <details key={item.q} className="group rounded-2xl border bg-card p-5 transition-shadow open:shadow-md">
                <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed prose-measure">{item.a}</p>
              </details>
            ))}
          </div>
          {section.section === 'Planning Your Livestream' && (
            <p className="mt-5 text-sm text-muted-foreground">
              Deeper answers:{' '}
              {PLANNING_LINKS.map((l, i) => (
                <span key={l.href}>
                  <Link href={l.href} className="text-primary font-medium hover:underline">
                    {l.label}
                  </Link>
                  {i < PLANNING_LINKS.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      ))}

      <div className="mt-12 p-8 rounded-3xl bg-accent/30 border border-accent text-center">
        <p className="text-muted-foreground mb-3">Still have questions?</p>
        <Link href="/contact" className="text-primary font-medium hover:underline">Get in touch →</Link>
      </div>
    </div>
  );
}
