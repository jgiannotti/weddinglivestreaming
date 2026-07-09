import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Contact', alternates: { canonical: '/contact' } };

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-10 md:py-14 text-center">
      <p className="eyebrow mb-3">Get in touch</p>
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6">Contact us</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Questions about your listing, billing, or something on the site? We&rsquo;d love to hear from you.
      </p>

      <a
        href="mailto:hello@weddinglivestreaming.com"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
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
