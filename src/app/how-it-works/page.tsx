import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/reveal';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { getListingStats } from '@/lib/data/listings';
import { FOUNDING_MONTHS } from '@/lib/founding-shared';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Finding the perfect live streaming vendor for your wedding is simple. Here\'s everything you need to know.',
  alternates: { canonical: '/how-it-works' },
};

const COUPLE_STEPS = [
  { title: 'Search Your City',     body: 'Enter your city or state in the search bar. Our directory instantly shows you live streaming vendors in your area, sorted by location.' },
  { title: 'Browse & Compare',     body: 'Review vendor profiles, see their service offerings, and explore their experience. Each listing gives you everything you need to make an informed choice.' },
  { title: 'Message Directly',     body: 'Found someone you love? Send them a message directly through their profile. No middlemen, no booking fees — just a direct conversation with your vendor.' },
];

const VENDOR_STEPS = [
  { title: 'Claim or Create Your Listing', body: 'Your business may already be listed from public information. Claim that profile, or add a new one in minutes with your services, location and a cover photo.' },
  { title: 'Get Discovered',       body: `Couples searching in your area find your listing. Add a starting price and a cover photo and it is Featured free for ${FOUNDING_MONTHS} months as a founding vendor.` },
  { title: 'Receive Inquiries',    body: 'Couples’ quote requests and messages come straight to you, with their contact details. Reply directly. There is no commission and no booking fee.' },
];

export default async function HowItWorksPage() {
  // Real counts instead of the "hundreds of professionals" this page claimed.
  const stats = await getListingStats();
  const vendorLine =
    stats.vendorCount > 0 && stats.stateCount > 0
      ? `${stats.vendorCount} live streaming ${stats.vendorCount === 1 ? 'vendor' : 'vendors'} in ${stats.stateCount} ${stats.stateCount === 1 ? 'state' : 'states'} ${stats.vendorCount === 1 ? 'is' : 'are'} listed. Claim your profile or add your business.`
      : 'Claim your profile or add your business. It is free.';

  return (
    <div>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'How It Works', path: '/how-it-works' }]} />
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20 text-center">
          <p className="eyebrow mb-3">The Process</p>
          <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl lg:text-6xl leading-tight">How It Works</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Finding the perfect live streaming vendor for your wedding is simple. Here&rsquo;s everything you need to know.
          </p>
        </div>
      </section>

      <Reveal>
        <section className="container py-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">For Couples</p>
            <h2 className="font-display text-3xl md:text-4xl">Finding Your Vendor</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to connect with the right professional.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {COUPLE_STEPS.map((step, i) => (
              <div key={step.title} className="border-t border-border pt-6">
                <span className="font-display text-5xl italic text-primary/25">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-2xl mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-secondary/30 py-20">
          <div className="container">
            <div className="text-center mb-12">
              <p className="eyebrow mb-2">For Vendors</p>
              <h2 className="font-display text-3xl md:text-4xl">Growing Your Business</h2>
              <p className="mt-3 text-muted-foreground">{vendorLine}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              {VENDOR_STEPS.map((step, i) => (
                <div key={step.title} className="border-t border-border pt-6">
                  <span className="font-display text-5xl italic text-primary/25">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-display text-2xl mt-3 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/claim">Find &amp; Claim Your Listing</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/submit-listing">Add a New Listing</Link></Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Both are free and need a free account.</p>
          </div>
        </section>
      </Reveal>

      <section className="container py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-3">Ready to Find Your Vendor?</h2>
          <p className="text-muted-foreground mb-8">Search our nationwide directory to discover live streaming professionals serving your city.</p>
          <Button asChild size="lg"><Link href="/directory">Browse All Vendors</Link></Button>
        </div>
      </section>
    </div>
  );
}
