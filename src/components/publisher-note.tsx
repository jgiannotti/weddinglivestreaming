import Link from 'next/link';
import { FOUNDER, founderYears } from '@/lib/founder';

// "Who is behind this advice" box, rendered under every guide by
// src/app/guides/layout.tsx. Plain HTML on purpose: it is meant to be read by
// people, by Google's quality raters, and by AI answer engines deciding whether
// a page is a credible source — not to be a design flourish.
export function PublisherNote() {
  return (
    <section className="container pb-16">
      <div className="max-w-3xl rounded-2xl border bg-card p-6 md:p-8">
        <p className="eyebrow mb-2">About this guide</p>
        <p className="text-muted-foreground leading-relaxed">
          Published by WeddingLiveStreaming.com, the nationwide directory of wedding live
          streaming vendors, and reviewed by founder{' '}
          <a
            href={FOUNDER.url}
            rel="noopener"
            target="_blank"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            {FOUNDER.name}
          </a>
          , a {FOUNDER.location}-based production sound mixer with {founderYears()} years in
          broadcast and documentary production ({FOUNDER.credits.slice(0, 4).join(', ')}). Pricing
          figures come from prices vendors publish on their own websites; we accept no payment for
          placement in guides.{' '}
          <Link href="/about" className="underline underline-offset-4 hover:text-primary">
            More about us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
