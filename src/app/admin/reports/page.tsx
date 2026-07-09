import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ReportActions } from './report-actions';

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, reason, details, status, created_at,
      reporter:profiles(email, display_name),
      listing:listings(id, title, slug, vendor:vendors(business_name))
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Reports</h1>
      <p className="text-muted-foreground mb-8">Content reports flagged by users.</p>

      {!reports || reports.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No reports on file.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r: any) => (
            <li key={r.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{r.reason}</h3>
                  <p className="text-sm text-muted-foreground">
                    {r.listing?.title ?? 'Listing removed'}
                    {r.listing?.vendor?.business_name ? ` · ${r.listing.vendor.business_name}` : ''}
                    {' · '}Reported {formatDate(r.created_at)}
                  </p>
                  {r.details && <p className="text-sm mt-2">{r.details}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    Reporter: {r.reporter?.display_name ?? r.reporter?.email ?? 'Anonymous'}
                  </p>
                  {r.listing?.slug && (
                    <Link
                      href={`/listing/${r.listing.slug}`}
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View listing →
                    </Link>
                  )}
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
                    Status: {r.status}
                  </p>
                </div>
                {r.status === 'new' || r.status === 'reviewed' ? (
                  <ReportActions reportId={r.id} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
