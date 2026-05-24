import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, MessageSquare, Plus, Eye, Inbox } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Finding the perfect live streaming vendor for your wedding is simple. Here\'s everything you need to know.',
};

const COUPLE_STEPS = [
  { icon: Search,        title: 'Search Your City',     body: 'Enter your city or state in the search bar. Our directory instantly shows you live streaming vendors in your area, sorted by location.' },
  { icon: Sparkles,      title: 'Browse & Compare',     body: 'Review vendor profiles, see their service offerings, and explore their experience. Each listing gives you everything you need to make an informed choice.' },
  { icon: MessageSquare, title: 'Message Directly',     body: 'Found someone you love? Send them a message directly through their profile. No middlemen, no booking fees — just a direct conversation with your vendor.' },
];

const VENDOR_STEPS = [
  { icon: Plus,   title: 'Create Your Listing',  body: 'Sign up and build your vendor profile in minutes. Add your services, location, bio, and photos to showcase your work.' },
  { icon: Eye,    title: 'Get Discovered',       body: 'Couples searching in your area will find your listing. Upgrade to Featured for premium placement at the top of search results.' },
  { icon: Inbox,  title: 'Receive Inquiries',    body: 'Interested couples message you directly through the platform. Respond at your own pace and grow your client base organically.' },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20 text-center">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">The Process</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium">How It Works</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Finding the perfect live streaming vendor for your wedding is simple. Here&rsquo;s everything you need to know.
          </p>
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">For Couples</p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">Finding Your Vendor</h2>
          <p className="mt-3 text-muted-foreground">Three simple steps to connect with the right professional.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {COUPLE_STEPS.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-primary mb-4 relative">
                <step.icon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{i + 1}</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/30 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">For Vendors</p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">Growing Your Business</h2>
            <p className="mt-3 text-muted-foreground">Join hundreds of live streaming professionals already connecting with couples.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {VENDOR_STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground mb-4 relative">
                  <step.icon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-card text-foreground border text-xs font-semibold">{i + 1}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Ready to Find Your Vendor?</h2>
          <p className="text-muted-foreground mb-8">Search our nationwide directory to discover live streaming professionals serving your city.</p>
          <Button asChild size="lg"><Link href="/directory">Browse All Vendors</Link></Button>
        </div>
      </section>
    </div>
  );
}
