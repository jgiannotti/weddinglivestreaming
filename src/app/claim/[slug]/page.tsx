import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BadgeCheck, ShieldCheck, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getListingBySlug } from '@/lib/data/listings';
import { ClaimForm } from './claim-form';
import { ensureProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Claim Your Profile',
  robots: { index: false },
};

const BENEFITS = [
  { icon: BadgeCheck,    text: 'Verified owner badge on your listing' },
  { icon: MessageSquare, text: 'Receive couple inquiries directly' },
  { icon: BarChart3,     text: 'Edit your profile, photos & coverage area' },
  { icon: ShieldCheck,   text: 'Free — no credit card required' },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClaimPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing || !listing.vendor) notFound();

  // Already owned — nothing to claim.
  if (listing.vendor.userId) redirect(`/listing/${listing.slug}`);

  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();

  let existingClaim: { status: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from('claim_requests')
      .select('status')
      .eq('listing_id', listing.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    existingClaim = data;
  }

  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <p className="eyebrow mb-2">Claim Your Profile</p>
      <h1 className="font-display text-3xl md:text-4xl mb-3">
        Is <em className="italic text-primary">{listing.vendor.businessName}</em> your business?
      </h1>
      <p className="text-muted-foreground mb-8 prose-measure">
        This profile was added from public information so couples in {listing.city},{' '}
        {listing.state} can find you. Claim it — free — to take control of it.
      </p>

      <ul className="grid sm:grid-cols-2 gap-3 mb-10">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
            <Icon className="h-5 w-5 text-primary shrink-0" />
            {text}
          </li>
        ))}
      </ul>

      {!user ? (
        <div className="rounded-3xl bg-accent/30 border border-accent p-8 text-center">
          <h2 className="font-display text-2xl mb-2">Create a free account to claim</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in (or register in under a minute) so we know who to hand the profile to.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/auth/register?next=/claim/${listing.slug}`}>Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href={`/auth/sign-in?next=/claim/${listing.slug}`}>Sign In</Link>
            </Button>
          </div>
        </div>
      ) : existingClaim ? (
        <div className="rounded-3xl bg-accent/30 border border-accent p-8 text-center">
          <h2 className="font-display text-2xl mb-2">
            {existingClaim.status === 'pending' && 'Your claim is being reviewed'}
            {existingClaim.status === 'approved' && 'This profile is yours'}
            {existingClaim.status === 'rejected' && 'Your previous claim wasn’t approved'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {existingClaim.status === 'pending' &&
              'We verify every claim by hand — usually within 1 business day. We’ll email you when it’s done.'}
            {existingClaim.status === 'approved' && (
              <>Manage it from your <Link href="/dashboard" className="text-primary underline">dashboard</Link>.</>
            )}
            {existingClaim.status === 'rejected' && (
              <>If you believe this was a mistake, <Link href="/contact" className="text-primary underline">contact us</Link> with proof of ownership.</>
            )}
          </p>
        </div>
      ) : (
        <ClaimForm listingId={listing.id} businessName={listing.vendor.businessName} />
      )}
    </div>
  );
}
