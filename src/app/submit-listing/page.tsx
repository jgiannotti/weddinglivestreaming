import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubmitListingForm } from './form';
import { ensureProfile } from '@/lib/auth';

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

  // If they already have a vendor profile, take them to their dashboard
  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) redirect('/dashboard/listings');

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 text-center">
        <p className="eyebrow mb-2">For Vendors</p>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-2">List your business</h1>
        <p className="text-muted-foreground">
          Tell couples about your wedding livestream services. Free to list, and your listing never expires.
        </p>
      </div>

      <SubmitListingForm userId={user.id} />
    </div>
  );
}
