import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { ContactForm } from './contact-form';
import { getListingBySlug } from '@/lib/data/listings';
import { createClient } from '@/lib/supabase/server';
import { PLACEHOLDER_LISTING_IMAGE } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContactPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-medium mb-2">Messaging coming soon</h1>
        <p className="text-muted-foreground mb-6">Direct messaging launches with our public release.</p>
        {listing.websiteUrl && (
          <a href={listing.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Visit {listing.title} directly →
          </a>
        )}
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/listing/${slug}/contact`);
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 flex items-center gap-4 pb-6 border-b">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <Image src={listing.heroImageUrl ?? PLACEHOLDER_LISTING_IMAGE} alt={listing.title} fill className="object-cover" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Contacting</p>
          <h1 className="font-display text-2xl font-semibold">{listing.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {listing.city}, {listing.state}
          </p>
        </div>
      </div>

      <ContactForm listingId={listing.id} vendorId={listing.vendorId} userEmail={user.email!} />

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Your message goes directly to the vendor — no middlemen, no booking fees.{' '}
        <Link href={`/listing/${slug}`} className="underline hover:text-foreground">Cancel</Link>
      </p>
    </div>
  );
}
