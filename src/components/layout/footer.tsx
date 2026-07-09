import Link from 'next/link';
import { Logo } from '@/components/logo';
import { SubscribeBox } from '@/components/subscribe-box';

const FOOTER_NAV = [
  {
    heading: 'Couples',
    links: [
      { label: 'Find Vendors',         href: '/directory' },
      { label: 'How It Works',         href: '/how-it-works' },
      { label: 'FAQ',                  href: '/faq' },
    ],
  },
  {
    heading: 'Vendors',
    links: [
      { label: 'List Your Business',   href: '/submit-listing' },
      { label: 'For Vendors',          href: '/for-vendors' },
      { label: 'Vendor Pricing',       href: '/pricing' },
    ],
  },
  {
    heading: 'Guides',
    links: [
      { label: 'Livestreaming Cost',     href: '/guides/wedding-live-streaming-cost' },
      { label: 'How to Live Stream',     href: '/guides/how-to-live-stream-a-wedding' },
      { label: 'DIY vs. Professional',   href: '/guides/diy-vs-professional-wedding-livestream' },
      { label: 'Vendor Questions',       href: '/guides/questions-to-ask-your-wedding-livestreamer' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',                href: '/about' },
      { label: 'Contact',              href: '/contact' },
      { label: 'Privacy Policy',       href: '/privacy-policy' },
      { label: 'Terms',                href: '/terms' },
    ],
  },
  {
    heading: 'Popular States',
    links: [
      { label: 'California',           href: '/wedding-live-streaming-california' },
      { label: 'Texas',                href: '/wedding-live-streaming-texas' },
      { label: 'Florida',              href: '/wedding-live-streaming-florida' },
      { label: 'New York',             href: '/wedding-live-streaming-new-york' },
      { label: 'Georgia',              href: '/wedding-live-streaming-georgia' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground mt-24">
      <div className="container py-16">
        {/* Brand moment */}
        <div className="mb-12">
          <Logo dark textClassName="text-3xl" iconClassName="h-8 w-8" />
          <p className="mt-3 italic text-ink-foreground/60 max-w-md">
            Every love story deserves every guest.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {FOOTER_NAV.map((section) => (
            <div key={section.heading}>
              <h4 className="eyebrow text-ink-foreground/50 mb-4">{section.heading}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-ink-foreground/80 hover:text-ink-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="max-w-md">
            <h4 className="font-display text-xl font-medium mb-1">Get vendor tips &amp; deals</h4>
            <p className="text-sm text-ink-foreground/60 mb-3">
              Occasional emails for couples planning a wedding live stream.
            </p>
            <SubscribeBox source="footer" dark />
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-foreground/50">
            © {new Date().getFullYear()} WeddingLiveStreaming. All rights reserved.
          </p>
          <p className="italic text-sm text-ink-foreground/60">
            Every love story deserves every guest.
          </p>
        </div>
      </div>
    </footer>
  );
}
