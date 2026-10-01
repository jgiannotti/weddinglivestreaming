import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubmitListingForm } from './form';
import { ensureProfile } from '@/lib/auth';
import { getMyVendor } from '@/lib/data/my-vendor';

export const metadata = { title: 'List Your Business', alternates: { canonical: '/submit-listing' } };
export const dynamic = 'force-dynamic';

export default async function SubmitListingPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-medium mb-2">Listing submissions coming soon</h1>
        <p className="text-muted-foreground">We&rsquo;re finalizing the platform. Check back in a few days.</p>
      </div>
    );
  }

  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) {
    redirect('/auth/register?next=/submit-listing');
  }

  // getMyVendor prefers a vendor that already has listings, so an account
  // with a finished listing is never sent back through this form.
  const mine = await getMyVendor(supabase, user.id);

  // A vendor record with a listing means they are done here. A vendor record
  // WITHOUT one means an earlier attempt failed partway (the vendor row is
  // written first). That used to bounce the vendor to a dashboard with no way
  // to add a listing, permanently. Now the form picks up where it stopped.
  let resume: { id: string; businessName: string; websiteUrl: string; phone: string } | null = null;
  if (mine) {
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', mine.id);
    if ((count ?? 0) > 0) redirect('/dashboard');
    const { data: details } = await supabase
      .from('vendors')
      .select('website_url, phone')
      .eq('id', mine.id)
      .maybeSingle();
    const d = (details as { website_url: string | null; phone: string | null } | null) ?? null;
    resume = {
      id: mine.id,
      businessName: mine.business_name ?? '',
      websiteUrl: d?.website_url ?? '',
      phone: d?.phone ?? '',
    };
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 text-center">
        <p className="eyebrow mb-2">For Vendors</p>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-2">List your business</h1>
        <p className="text-muted-foreground">
          Tell couples about your wedding livestream services. Free to list, and your listing never expires.
        </p>
      </div>

      {/* Most vendors who reach this page are already in the directory (it was
          seeded from public sources). Creating a second listing gives them a
          duplicate and leaves the original unclaimed, so point them at the
          claim flow before they start typing. */}
      <p className="rounded-2xl border bg-accent/30 px-5 py-4 text-sm mb-8">
        <strong>Already in the directory?</strong> We may have listed your business from public
        information.{' '}
        <Link href="/claim" className="text-primary font-medium hover:underline">
          Search for it and claim it
        </Link>{' '}
        instead of creating a second listing.
      </p>

      <SubmitListingForm userId={user.id} resumeVendor={resume} />
    </div>
  );
}
