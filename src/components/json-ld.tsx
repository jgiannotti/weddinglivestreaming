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
