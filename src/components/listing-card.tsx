import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PLACEHOLDER_LISTING_IMAGE } from '@/lib/constants';
import type { Listing } from '@/lib/types';

interface ListingCardProps {
  listing: Listing;
  priority?: boolean;
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const isFeatured = listing.tier === 'featured';

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group block rounded-2xl overflow-hidden border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={listing.heroImageUrl ?? PLACEHOLDER_LISTING_IMAGE}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="featured-badge">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {listing.city}, {listing.state}
          </span>
          {listing.distanceMiles !== undefined && (
            <span className="shrink-0 text-xs font-medium text-muted-foreground/80">
              {listing.searchTier === 3
                ? '· Travels to you'
                : `· ~${Math.round(listing.distanceMiles)} mi away`}
            </span>
          )}
        </div>

        {listing.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.categories.slice(0, 2).map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
