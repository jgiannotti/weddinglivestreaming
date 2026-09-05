import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { FOUNDER, FOUNDER_BIO_SHORT } from '@/lib/founder';

export const metadata: Metadata = {
  title: 'About WeddingLiveStreaming.com — Who We Are and How We Work',
  description:
    'The only U.S. directory dedicated to wedding live streaming, founded by Tampa production sound mixer Joe Giannotti. No commissions, no fees for couples, vendor-published pricing.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="container py-10 md:py-14">
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} />
      <p className="eyebrow mb-3">About Us</p>
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6">Every love story deserves every guest.</h1>

      <div className="prose-measure text-foreground/80 space-y-5 text-lg leading-relaxed">
        <p>
          WeddingLiveStreaming.com exists for a simple reason: distance shouldn&rsquo;t keep the people who matter most from being part of your wedding day. Grandparents who can&rsquo;t travel. Friends stationed overseas. Family separated by visa delays, work commitments, illness, or thousands of miles.
        </p>
        <p>
          We built the only directory in the United States dedicated exclusively to professional wedding live streaming. Every vendor here does this work for a living — they know weddings, they know broadcast-quality streaming, and they know how to make remote guests feel like they&rsquo;re in the room.
        </p>
        <p>
          We don&rsquo;t take commissions. We don&rsquo;t charge couples a cent. Vendors pay nothing to list (or a small monthly fee for premium placement). Our job is to make the introduction — what happens next is between you and your vendor.
        </p>
      </div>

      <section id="founder" className="mt-14 max-w-3xl">
        <p className="eyebrow mb-3">Who&rsquo;s behind it</p>
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">{FOUNDER.name}</h2>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>{FOUNDER_BIO_SHORT()}</p>
          <p>
            That background is why this directory cares about the unglamorous parts of a
            livestream: whether the vows are actually audible, whether there&rsquo;s a backup
            internet connection, and whether someone is watching the stream the whole time. Those
            are the questions our guides push couples to ask, and the reason listings show real,
            vendor-published pricing instead of &ldquo;contact for a quote.&rdquo;
          </p>
          <p>
            Joe&rsquo;s production work lives at{' '}
            <a
              href={FOUNDER.url}
              rel="noopener"
              target="_blank"
              className="underline underline-offset-4 hover:text-primary"
            >
              floridasoundman.com
            </a>
            . Questions, corrections, or press inquiries:{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
              contact us
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <p className="eyebrow mb-3">How we work</p>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>
            Vendors are listed because they publicly offer wedding livestreaming — most were added
            from their own websites and can claim, edit, or remove their listing free at any time.
            Prices shown on profiles and in our{' '}
            <Link href="/guides/wedding-live-streaming-cost-by-state" className="underline underline-offset-4 hover:text-primary">
              cost data
            </Link>{' '}
            are what vendors publish themselves; we never estimate a price for a vendor. Guides are
            written from that data and from production experience, and no vendor pays to be
            mentioned in one.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/directory">Find a Vendor</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/contact">Contact Us</Link></Button>
      </div>
    </div>
  );
}
