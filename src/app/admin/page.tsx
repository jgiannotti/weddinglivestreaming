import { createClient } from '@/lib/supabase/server';

export default async function AdminOverview() {
  const supabase = await createClient();

  const [pending, vendors, listings, reports] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const stats = [
    { label: 'Pending approval', value: pending.count || 0, accent: true },
    { label: 'Total vendors',    value: vendors.count || 0 },
    { label: 'Live listings',    value: listings.count || 0 },
    { label: 'Open reports',     value: reports.count || 0, accent: true },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Admin</h1>
      <p className="text-muted-foreground mb-8">Site overview and moderation queue.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.accent && s.value > 0 ? 'bg-accent border-primary' : 'bg-card'}`}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
            <p className="font-display text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
