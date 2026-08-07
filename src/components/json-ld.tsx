import { getPlaceholderImage } from '@/lib/constants';
import type { Listing } from '@/lib/types';

// JSON.stringify does not escape '<', so vendor-controlled text (e.g. a listing
// title/description containing "</script><script>...") could break out of the
// JSON-LD <script> tag and execute as HTML/JS. Escape '<' to '<' before
// injecting via dangerouslySetInnerHTML.
function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

interface ListingJsonLdProps {
  listing: Listing;
}

export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const hasCoordinates = listing.lat != null && listing.lng != null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: listing.title,
    description: listing.description,
    image: listing.heroImageUrl ?? getPlaceholderImage(listing.id),
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com'}/listing/${listing.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city,
      addressRegion: listing.state,
      addressCountry: 'US',
    },
    ...(hasCoordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.lat,
        longitude: listing.lng,
      },
    }),
    serviceType: 'Wedding Live Streaming',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WeddingLiveStreaming',
    url: 'https://weddinglivestreaming.com',
    description: 'The nationwide directory of wedding live streaming professionals.',
    sameAs: [],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

// WebSite + SearchAction — tells Google (and AI engines) the site has an
// internal search so they can surface a sitelinks searchbox / route queries
// to /directory?location=... instead of a plain external link.
export function WebsiteJsonLd() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WeddingLiveStreaming',
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/directory?location={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  path: string; // e.g. "/directory" — resolved against NEXT_PUBLIC_SITE_URL
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

// ItemList for directory/state/city listing grids — helps AI engines and
// Google understand "this page is a ranked list of N businesses."
export function ListingsItemListJsonLd({ listings }: { listings: Listing[] }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: listings.map((listing, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/listing/${listing.slug}`,
      name: listing.title,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

// Generic ItemList for non-listing collections (e.g. the guides hub) — same
// shape as ListingsItemListJsonLd but takes plain name/path pairs.
export function PagesItemListJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}${item.path}`,
      name: item.name,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

// Article schema for long-form guide/blog content — helps Google and AI
// engines identify authorship-style informational pages (vs. business
// listings). datePublished is intentionally omitted unless known — we don't
// fabricate dates.
export function ArticleJsonLd({
  headline,
  description,
}: {
  headline: string;
  description: string;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'WeddingLiveStreaming',
      url: base,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

// Dataset schema for pages built from our own directory data (e.g. the
// cost-by-state page). Original datasets are what blogs and AI engines cite —
// marking it up as a Dataset makes the numbers discoverable in Google Dataset
// Search and unambiguous to answer engines.
export function DatasetJsonLd({
  name,
  description,
  url,
  dateModified,
}: {
  name: string;
  description: string;
  url: string; // path, e.g. "/guides/wedding-live-streaming-cost-by-state"
  dateModified: string; // ISO date, e.g. "2026-08-07"
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: `${base}${url}`,
    dateModified,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: 'WeddingLiveStreaming',
      url: base,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export interface HowToStep {
  name: string;
  text: string;
}

// HowTo schema for step-by-step DIY guides.
export function HowToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: HowToStep[];
}) {
  if (steps.length === 0) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
