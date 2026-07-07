import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description: 'WeddingLiveStreaming.com — the only directory dedicated to wedding live streaming.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-16">
      <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">About Us</p>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-6">Every love story deserves every guest.</h1>

      <div className="prose prose-lg max-w-none text-foreground/80 space-y-5">
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

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/directory">Find a Vendor</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/contact">Contact Us</Link></Button>
      </div>
    </div>
  );
}
