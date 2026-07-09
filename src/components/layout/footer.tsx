import Link from 'next/link';
import { Heart } from 'lucide-react';
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
    <footer className="border-t bg-secondary/30 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {FOOTER_NAV.map((section) => (
            <div key={section.heading}>
              <h4 className="font-display text-base font-semibold mb-4">{section.heading}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h4 className="font-display text-base font-semibold mb-1">Get vendor tips &amp; deals</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Occasional emails for couples planning a wedding live stream.
            </p>
            <SubscribeBox source="footer" />
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 fill-primary text-primary" />
            <span>WeddingLiveStreaming.com</span>
            <span className="hidden sm:inline">·</span>
            <span>Every love story deserves every guest.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WeddingLiveStreaming. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
