import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, MessageSquare, MapPin, Sparkles, Clock, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Vendors',
  description: 'Reach couples actively searching for wedding live streaming. Create your free vendor listing in minutes. No commissions, no middleman — direct inquiries only.',
  alternates: { canonical: '/for-vendors' },
};

const REASONS = [
  { icon: Target,        title: 'Targeted Visibility',    body: 'Couples searching for live streaming in your city see your listing. No competing with photographers, florists, or caterers — only streaming vendors.' },
  { icon: MessageSquare, title: 'Direct Inquiries',       body: 'Couples message you directly through your listing. You own the relationship from day one — no platform fees on bookings.' },
  { icon: MapPin,        title: 'Location-Based Matching', body: 'Our geolocation system surfaces your listing to couples in your service area. You show up when it matters most.' },
  { icon: Sparkles,      title: 'Free to Start',          body: 'Create a basic listing at no cost. Upgrade to Featured when you\'re ready for maximum visibility and top placement.' },
  { icon: Clock,         title: 'Set & Forget',           body: 'List once, update whenever you want. Your profile works for you 24/7 while you focus on delivering great events.' },
  { icon: Search,        title: 'SEO Presence',           body: 'Your listing appears in search results for "[city] wedding live streaming" — high-intent searches from couples ready to hire.' },
];

export default function ForVendorsPage() {
  return (
    <div>
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20 text-center">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">Grow Your Business</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium">For Wedding Live Streaming Vendors</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with couples actively searching for your services. List your business in minutes and start receiving direct inquiries.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/submit-listing">List Your Business Free</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/pricing">View Pricing →</Link></Button>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">Why List With Us</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">Built for Live Streaming Professionals</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            We&rsquo;re the only directory dedicated exclusively to wedding live streaming. Every visitor is actively looking for exactly what you offer.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {REASONS.map((r) => (
            <div key={r.title} className="rounded-xl border bg-card p-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary mb-4">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Ready to Grow Your Business?</h2>
          <p className="text-muted-foreground mb-8">Join hundreds of live streaming professionals connecting with couples on WeddingLiveStreaming.com.</p>
          <Button asChild size="lg"><Link href="/submit-listing">List Your Business Today</Link></Button>
        </div>
      </section>
    </div>
  );
}
