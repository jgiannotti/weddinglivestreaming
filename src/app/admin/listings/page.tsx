import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ApprovalButtons } from './approval-buttons';
import { formatDate } from '@/lib/utils';

export default async function AdminListingsPage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from('listings')
    .select('id, title, slug, city, state, created_at, vendor:vendors(business_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Pending Listings</h1>
      <p className="text-muted-foreground mb-8">Review and approve new vendor submissions.</p>

      {!pending || pending.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          Inbox zero — no listings waiting for review.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((l: any) => (
            <li key={l.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {l.city}, {l.state} · {l.vendor?.business_name} · Submitted {formatDate(l.created_at)}
                  </p>
                  <Link href={`/listing/${l.slug}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                    View →
                  </Link>
                </div>
                <ApprovalButtons listingId={l.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
