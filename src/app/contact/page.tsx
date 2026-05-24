import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-16 text-center">
      <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">Get in touch</p>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-6">Contact us</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Questions about your listing, billing, or something on the site? We&rsquo;d love to hear from you.
      </p>

      <a
        href="mailto:hello@weddinglivestreaming.com"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
      >
        <Mail className="h-4 w-4" />
        hello@weddinglivestreaming.com
      </a>

      <p className="mt-12 text-sm text-muted-foreground">
        We typically respond within one business day.
      </p>
    </div>
  );
}
