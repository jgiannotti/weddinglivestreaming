import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClaimButtons } from './claim-buttons';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminClaimsPage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from('claim_requests')
    .select('id, details, created_at, user:profiles(email, display_name), listing:listings(title, slug, city, state, vendor:vendors(business_name, website_url))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Profile Claims</h1>
      <p className="text-muted-foreground mb-8">
        Verify each claim before approving — check the business email domain against the
        listing&rsquo;s website, or call the number on their site. Approving hands the vendor
        profile (and all its listings) to the claimant.
      </p>

      {!pending || pending.length === 0 ? (
        <div className="rounded-xl border-2 p-10 text-center text-muted-foreground">
          No claims waiting for review.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((c: any) => (
            <li key={c.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold mb-1">
                    {c.listing?.vendor?.business_name ?? c.listing?.title}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {c.listing?.city}, {c.listing?.state}
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Claimed by {c.user?.display_name || c.user?.email} ({c.user?.email}) ·{' '}
                    {formatDate(c.created_at)}
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted rounded-lg p-3 mb-2">{c.details}</pre>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {c.listing?.slug && (
                      <Link href={`/listing/${c.listing.slug}`} className="text-primary hover:underline">
                        View listing →
                      </Link>
                    )}
                    {c.listing?.vendor?.website_url && (
                      <a
                        href={c.listing.vendor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Vendor website ↗
                      </a>
                    )}
                  </div>
                </div>
                <ClaimButtons claimId={c.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
