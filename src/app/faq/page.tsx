import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'FAQ' };

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
    section: 'For Vendors',
    items: [
      { q: 'How long does my listing stay up?', a: '12 months from the date your listing is approved. We\'ll email you before it expires so you can renew.' },
      { q: 'What\'s the difference between Basic and Featured?', a: 'Basic is free forever with a full profile and direct messaging. Featured ($29/mo or $199/yr) puts you at the top of search results, gives you a gold badge, and includes a spot in the homepage spotlight.' },
      { q: 'Can I cancel Featured anytime?', a: 'Yes — cancel from your dashboard. Your listing reverts to Basic at the end of your billing period.' },
      { q: 'Are there commission fees on bookings?', a: 'Never. Whatever you charge a couple, you keep 100% of it. The monthly fee is the only cost.' },
      { q: 'Can I pay with PayPal instead of credit card?', a: 'Yes. At checkout you can choose Stripe (cards) or PayPal — whichever you prefer.' },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container max-w-3xl py-16">
      <div className="text-center mb-12">
        <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">FAQ</p>
        <h1 className="font-display text-4xl md:text-5xl font-medium">Frequently Asked Questions</h1>
      </div>

      {FAQ_ITEMS.map((section) => (
        <div key={section.section} className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-6">{section.section}</h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <details key={item.q} className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md">
                <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-8 rounded-2xl bg-accent/30 border text-center">
        <p className="text-muted-foreground mb-3">Still have questions?</p>
        <Link href="/contact" className="text-primary font-medium hover:underline">Get in touch →</Link>
      </div>
    </div>
  );
}
