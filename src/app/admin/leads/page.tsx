import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { CsvExportButton } from './csv-export-button';

const CSV_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'venue_city', label: 'Venue City' },
  { key: 'venue_state', label: 'Venue State' },
  { key: 'wedding_date', label: 'Wedding Date' },
  { key: 'guest_count', label: 'Guest Count' },
  { key: 'budget', label: 'Budget' },
  { key: 'status', label: 'Status' },
  { key: 'matched_vendor_count', label: 'Matched Vendors' },
  { key: 'created_at', label: 'Submitted' },
];

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, venue_city, venue_state, wedding_date, guest_count, budget, status, matched_vendor_ids, created_at')
    .order('created_at', { ascending: false });

  const rows = (leads ?? []).map((l: any) => ({
    ...l,
    matched_vendor_count: (l.matched_vendor_ids ?? []).length,
  }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-display text-3xl md:text-4xl font-medium">Leads</h1>
        <CsvExportButton rows={rows} columns={CSV_COLUMNS} filename="leads.csv" />
      </div>
      <p className="text-muted-foreground mb-8">Couple submissions from "Get Free Quotes" forms.</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No leads yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Wedding Date</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Matched</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{l.email}</div>
                    {l.phone && <div className="text-xs">{l.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[l.venue_city, l.venue_state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.wedding_date ? formatDate(l.wedding_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.guest_count ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.budget ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{l.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.matched_vendor_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
