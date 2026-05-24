import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Globe, Sparkles, MessageSquare, Flag, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListingCard } from '@/components/listing-card';
import {
  getListingBySlug,
  getRelatedListings,
  MOCK_LISTINGS,
} from '@/data/mock-listings';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MOCK_LISTINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) return { title: 'Vendor Not Found' };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: [{ url: listing.heroImageUrl }],
    },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  const related = getRelatedListings(listing, 3);

  return (
    <div>
      {/* HERO */}
      <div className="relative aspect-[16/8] md:aspect-[16/6] overflow-hidden bg-muted">
        <Image
          src={listing.heroImageUrl}
          alt={listing.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container py-8 md:py-12">
          {listing.tier === 'featured' && (
            <span className="featured-badge mb-3 inline-flex">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
          <h1 className="font-display text-4xl md:text-6xl font-medium text-white">{listing.title}</h1>
          <div className="mt-3 flex items-center gap-1.5 text-white/90">
            <MapPin className="h-4 w-4" />
            <span>{listing.city}, {listing.state}</span>
          </div>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* MAIN COLUMN */}
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {listing.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
              ))}
            </div>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold mb-4">About this vendor</h2>
              <p className="text-base md:text-lg leading-relaxed text-foreground/80 whitespace-pre-line">
                {listing.description}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold mb-4">Location</h2>
              <div className="rounded-xl overflow-hidden border bg-muted aspect-[16/9] relative">
                <iframe
                  title={`Map of ${listing.title}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.05}%2C${listing.lat - 0.05}%2C${listing.lng + 0.05}%2C${listing.lat + 0.05}&layer=mapnik&marker=${listing.lat}%2C${listing.lng}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                View on Google Maps
              </a>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="rounded-xl border bg-card p-6">
              {listing.vendor && (
                <Link
                  href={`/vendor/${listing.vendor.slug}`}
                  className="flex items-center gap-3 pb-4 border-b mb-4"
                >
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-semibold">
                    {listing.vendor.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{listing.vendor.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {formatDate(listing.vendor.memberSince)}
                    </p>
                  </div>
                </Link>
              )}

              <Button asChild size="lg" className="w-full mb-2">
                <Link href={`/listing/${listing.slug}/contact`}>
                  <MessageSquare className="h-4 w-4" />
                  Message Vendor
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full mb-2">
                <Heart className="h-4 w-4" />
                Add to Favorites
              </Button>
              {listing.websiteUrl && (
                <Button asChild variant="ghost" size="lg" className="w-full">
                  <a href={listing.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Verified vendor</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Listed on {formatDate(listing.createdAt)}</span>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Claim Listing
              </button>
              <span className="text-muted-foreground">·</span>
              <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          </aside>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Related Vendors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
