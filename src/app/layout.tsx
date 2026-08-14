import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/json-ld';
import { Analytics } from '@vercel/analytics/next';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  // `weight` must be 'variable' (not a fixed array) whenever `axes` is set —
  // Fraunces is a variable font, so this still gives every weight from
  // 100-900 (font-medium/font-semibold utility classes keep working) plus
  // the optical-size axis the spec calls for, without the invalid combo
  // that broke the production build (`next/font` throws at build time).
  weight: 'variable',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com'),
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
  verification: {
    google: 'rx-O-t2dI5gOpwWA-wkDJLZAE1FnmK8fAhcwilfmyc0',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      {/* ClerkProvider goes INSIDE <body>, not wrapping <html> — wrapping the
          html element breaks Next's font-variable classes and hydration. */}
      <body className="flex min-h-screen flex-col">
        <ClerkProvider
          signInUrl="/auth/sign-in"
          signUpUrl="/auth/register"
          appearance={{
            variables: {
              colorPrimary: 'hsl(var(--primary))',
              borderRadius: '0.75rem',
              fontFamily: 'var(--font-inter)',
            },
          }}
        >
          <OrganizationJsonLd />
          <WebsiteJsonLd />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
