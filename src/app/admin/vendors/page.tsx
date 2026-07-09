import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { AnnouncementForm } from './announcement-form';

// Mirrors effectiveTier() in src/lib/data/listings.ts — a listing whose
// featured_until has passed reads back as 'basic' immediately, regardless of
// what the tier column still says in the DB.
function effectiveTier(row: any): 'basic' | 'featured' {
  if (!row) return 'basic';
  if (row.tier !== 'featured') return 'basic';
  if (!row.featured_until) return 'featured';
  return new Date(row.featured_until) > new Date() ? 'featured' : 'basic';
}

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      id, business_name, slug, phone, member_since, created_at,
      profile:profiles(email),
      listings(id, slug, status, tier, featured_until, created_at)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Vendors</h1>
      <p className="text-muted-foreground mb-8">All registered vendor accounts.</p>

      {!vendors || vendors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground mb-10">
          No vendors yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto mb-10">
          <table className="w-full text-sm" aria-label="Vendors">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Listing</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v: any) => {
                const listings = (v.listings ?? []) as any[];
                const primary = [...listings].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                const tier = effectiveTier(primary);

                return (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{v.business_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{v.profile?.email ?? '—'}</div>
                      {v.phone && <div className="text-xs">{v.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          tier === 'featured'
                            ? 'inline-flex items-center rounded-full bg-accent border border-primary px-2 py-0.5 text-xs font-medium'
                            : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                        }
                      >
                        {tier === 'featured' ? 'Featured' : 'Basic'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {primary?.status ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(v.member_since ?? v.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {primary?.slug ? (
                        <Link href={`/listing/${primary.slug}`} className="text-primary hover:underline">
                          View →
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnnouncementForm />
    </div>
  );
}
