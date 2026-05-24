import Link from 'next/link';
import { Plus, Eye, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find vendor record for current user
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, slug')
    .eq('user_id', user.id)
    .maybeSingle();

  let listings: Array<{ id: string; title: string; slug: string; tier: string; status: string; view_count: number; inquiry_count: number }> = [];
  let unreadMessages = 0;

  if (vendor) {
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, title, slug, tier, status, view_count, inquiry_count')
      .eq('vendor_id', vendor.id);
    listings = listingData || [];

    const { count: unread } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_vendor_id', vendor.id)
      .is('read_at', null);
    unreadMessages = unread || 0;
  }

  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiry_count, 0);

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your listings and inquiries.</p>

      {!vendor && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-4">You don&rsquo;t have a listing yet.</p>
          <Button asChild>
            <Link href="/submit-listing">
              <Plus className="h-4 w-4" />
              Create Your Listing
            </Link>
          </Button>
        </div>
      )}

      {vendor && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Views</p>
              <p className="font-display text-3xl font-semibold">{totalViews}</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Inquiries</p>
              <p className="font-display text-3xl font-semibold">{totalInquiries}</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Unread Messages</p>
              <p className="font-display text-3xl font-semibold">{unreadMessages}</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold mb-4">Your Listings</h2>
          <div className="space-y-3 mb-8">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    {listing.tier === 'featured' && (
                      <Badge variant="gold" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {listing.status === 'pending' && (
                      <Badge variant="secondary">Pending review</Badge>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.view_count} views</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {listing.inquiry_count} inquiries</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/listing/${listing.slug}`}>View</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-accent/30 border p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold mb-2">Want more visibility?</h3>
            <p className="text-sm text-muted-foreground mb-4">Upgrade to Featured for top placement in search results and the homepage spotlight.</p>
            <Button asChild>
              <Link href="/dashboard/plan">View Plans</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
