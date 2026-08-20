import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditListingForm } from './form';
import { ensureProfile } from '@/lib/auth';

export const metadata = { title: 'Edit Listing' };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Fixes a real dead link: the dashboard's "Edit" button
// (src/app/dashboard/page.tsx) has pointed at /dashboard/listings/[id]/edit
// since the dashboard was built, but this route never existed — every vendor
// hit a 404 trying to edit their own listing. Found during the Milestone 2
// "use it like a couple" / "use it like a vendor" audit and fixed here,
// since it's also the natural home for the new radius/nationwide controls.
export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) redirect(`/auth/sign-in?next=/dashboard/listings/${id}/edit`);

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!vendor) redirect('/dashboard');

  // RLS ("vendor owners manage their listings") already scopes this to the
  // signed-in vendor's own rows, but we also check vendor_id explicitly here
  // for a clean 404 instead of a confusing empty-form state if someone
  // guesses another vendor's listing id.
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .maybeSingle();

  if (!listing) notFound();

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8">
        <p className="eyebrow mb-2">Your Listing</p>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Edit listing</h1>
        <p className="text-muted-foreground">Update your details, coverage area, pricing, and crew size.</p>
      </div>

      <EditListingForm
        listing={{
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          heroImageUrl: listing.hero_image_url ?? null,
          websiteUrl: listing.website_url ?? '',
          city: listing.city,
          state: listing.state,
          serviceRadiusMiles: listing.service_radius_miles ?? 60,
          travelsNationwide: listing.travels_nationwide ?? false,
          startingPriceCents: listing.starting_price_cents ?? null,
          crewType: listing.crew_type ?? null,
        }}
      />
    </div>
  );
}
