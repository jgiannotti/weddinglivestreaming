import { PLACEHOLDER_LISTING_IMAGE } from '@/lib/constants';
import type { Listing } from '@/lib/types';

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
    image: listing.heroImageUrl ?? PLACEHOLDER_LISTING_IMAGE,
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
