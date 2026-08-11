import Link from 'next/link';
import { Heart, Mail, Phone, CalendarDays, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ensureProfile } from '@/lib/auth';

// Couples' quote requests matched to this vendor. Row visibility is enforced
// by RLS ("vendors see leads matched to them" — matched_vendor_ids must
// contain one of the signed-in user's vendor ids), so the query below can
// stay simple: whatever comes back is theirs to see.
export default async function VendorLeadsPage() {
  const supabase = await createClient();
  const user = await ensureProfile();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!vendor) {
    return <p className="text-muted-foreground">You don&rsquo;t have a vendor profile yet.</p>;
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, wedding_date, venue_city, venue_state, guest_count, budget, message, created_at')
    .contains('matched_vendor_ids', [vendor.id])
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Leads</h1>
      <p className="text-muted-foreground mb-8 prose-measure">
        Couples who requested quotes for a wedding in your service area. Reach
        out directly — replying within a day dramatically improves your odds of
        booking.
      </p>

      {(!leads || leads.length === 0) ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No leads yet. When a couple near you requests quotes, their details
          will appear here and you&rsquo;ll get an email.
        </div>
      ) : (
        <ul className="space-y-4">
          {leads.map((lead) => {
            const venue = [lead.venue_city, lead.venue_state].filter(Boolean).join(', ');
            return (
              <li key={lead.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{lead.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Received {formatDate(lead.created_at)}</p>
                  </div>
                  <Link
                    href={`mailto:${lead.email}?subject=${encodeURIComponent('Your wedding livestream quote request')}`}
                    className="shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    Reply by Email
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                  </p>
                  {lead.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                    </p>
                  )}
                  {venue && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {venue}
                    </p>
                  )}
                  {lead.wedding_date && (
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {formatDate(lead.wedding_date)}
                    </p>
                  )}
                  {lead.guest_count != null && (
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {lead.guest_count} guests
                    </p>
                  )}
                  {lead.budget && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      Budget: <span className="text-foreground">{lead.budget}</span>
                    </p>
                  )}
                </div>

                {lead.message && (
                  <blockquote className="rounded-lg bg-muted/50 border-l-2 border-primary/40 px-4 py-3 text-sm leading-relaxed">
                    {lead.message}
                  </blockquote>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
