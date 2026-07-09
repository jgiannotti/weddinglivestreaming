import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { CsvExportButton } from '../leads/csv-export-button';

const CSV_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'source', label: 'Source' },
  { key: 'created_at', label: 'Subscribed' },
];

export default async function AdminSubscribersPage() {
  const supabase = await createClient();
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false });

  const rows = subscribers ?? [];

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-display text-3xl md:text-4xl font-medium">Subscribers</h1>
        <CsvExportButton rows={rows} columns={CSV_COLUMNS} filename="subscribers.csv" />
      </div>
      <p className="text-muted-foreground mb-8">Couples opted in for planning tips.</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No subscribers yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm" aria-label="Subscribers">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.source ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
