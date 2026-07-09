import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/json-ld';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com'),
  title: {
    default: 'Find Wedding Live Streaming Vendors Near You | WeddingLiveStreaming.com',
    template: '%s | WeddingLiveStreaming',
  },
  description:
    'The nationwide directory of professional wedding live streaming vendors. Connect directly with vendors in your area — free for couples.',
  // NOTE: canonical is intentionally set per-page (via each page's own
  // `metadata`/`generateMetadata`), not here. Next.js inherits unset metadata
  // fields from parent layouts down to child pages — a root-level default
  // canonical would silently apply to every page that doesn't set its own,
  // which would wrongly claim the homepage as canonical for everything.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'WeddingLiveStreaming',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-video-preview': -1,
    'max-image-preview': 'large',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="flex min-h-screen flex-col">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
