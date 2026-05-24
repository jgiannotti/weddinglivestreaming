import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubmitListingForm } from './form';
import { CATEGORIES } from '@/lib/categories';

export const metadata = { title: 'List Your Business' };
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
  const { data: { user } } = await supabase.auth.getUser();
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
        <p className="text-sm font-medium tracking-wider uppercase text-primary mb-2">For Vendors</p>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">List your business</h1>
        <p className="text-muted-foreground">
          Tell couples about your wedding livestream services. Free to list, 12-month duration.
        </p>
      </div>

      <SubmitListingForm categories={CATEGORIES} userId={user.id} />
    </div>
  );
}
