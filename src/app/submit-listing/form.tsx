'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';
import type { Category } from '@/lib/types';
import { suggestRadiusDefaults } from '@/lib/categories';
import { US_STATES } from '@/lib/states';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface Props {
  categories: Category[];
  userId: string;
}

export function SubmitListingForm({ categories, userId }: Props) {
  const router = useRouter();
  // Supabase client carrying the caller's Clerk token, so the insert lands
  // under their own RLS identity rather than anonymously.
  const supabase = useSupabase();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Milestone 2 — coverage radius. Pre-filled from category selection
  // (radiusTouched guards against clobbering a manual edit once the vendor
  // has interacted with the slider themselves).
  const [radiusMiles, setRadiusMiles] = useState(60);
  const [nationwide, setNationwide] = useState(false);
  const [radiusTouched, setRadiusTouched] = useState(false);

  function toggleCategory(id: string) {
    const next = new Set(selectedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCategories(next);

    if (!radiusTouched) {
      const slugs = categories.filter((c) => next.has(c.id)).map((c) => c.slug);
      const { radiusMiles: suggested, nationwide: suggestedNationwide } = suggestRadiusDefaults(slugs);
      setRadiusMiles(suggested);
      setNationwide(suggestedNationwide);
    }
  }

  async function geocode(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const q = encodeURIComponent(`${city}, ${state}, USA`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await res.json();
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { /* fall through */ }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // (hoisted to the component body — hooks can't run inside a handler)
      const slug = slugify(businessName);

      // 1. Create vendor record
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          business_name: businessName,
          slug,
          website_url: websiteUrl || null,
          phone: phone || null,
        })
        .select('id')
        .single();
      if (vendorErr) throw vendorErr;

      // 2. Upload hero image (if provided)
      let heroUrl: string | null = null;
      if (heroFile) {
        const path = `listings/${slug}-${Date.now()}-${heroFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('listings')
          .upload(path, heroFile, { upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from('listings').getPublicUrl(path);
        heroUrl = pub.publicUrl;
      }

      // 3. Geocode city/state
      const coords = await geocode(city, state);

      // 4. Create listing
      const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .insert({
          vendor_id: vendor.id,
          title: businessName,
          slug,
          description,
          hero_image_url: heroUrl,
          website_url: websiteUrl || null,
          city,
          state,
          lat: coords?.lat,
          lng: coords?.lng,
          status: 'pending',
          tier: 'basic',
          service_radius_miles: radiusMiles,
          travels_nationwide: nationwide,
        })
        .select('id, slug')
        .single();
      if (listingErr) throw listingErr;

      // 5. Link categories
      if (selectedCategories.size > 0) {
        await supabase.from('listing_categories').insert(
          [...selectedCategories].map((catId) => ({ listing_id: listing.id, category_id: catId }))
        );
      }

      // Update profile role to vendor. Direct role updates are blocked by
      // column-level grants (migration 0009 — privilege-escalation fix);
      // this SECURITY DEFINER function only ever does couple -> vendor on
      // the caller's own row.
      await supabase.rpc('become_vendor');

      router.push(`/dashboard?welcome=1`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Business details</h2>

        <div>
          <label htmlFor="businessName" className="block text-sm font-medium mb-1.5">Business name *</label>
          <Input id="businessName" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1.5">Description *</label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Tell couples about your services — equipment, experience, what makes you different…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1.5">Website</label>
            <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1.5">Phone</label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Location</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1.5">City *</label>
            <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-1.5">State *</label>
            {/* Select, not free text: state pages and search filter on the full
                state name, so "CA" or "Calif." made a listing invisible on
                /wedding-live-streaming-california. */}
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="state" className="rounded-md">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.slug} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">We&rsquo;ll auto-detect your coordinates from the city + state for map display.</p>
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">How far will you travel?</h2>
        <p className="text-sm text-muted-foreground">
          Couples searching within this distance of your city will find you. We picked a starting
          number based on your categories below — adjust it to fit how you actually work.
        </p>

        <label className="flex items-center gap-2 px-3 py-2.5 rounded-full border cursor-pointer hover:bg-muted transition-colors w-fit">
          <input
            type="checkbox"
            checked={nationwide}
            onChange={(e) => {
              setNationwide(e.target.checked);
              setRadiusTouched(true);
            }}
            className="rounded"
          />
          <span className="text-sm font-medium">I travel nationwide for destination weddings</span>
        </label>

        {!nationwide && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="radius" className="text-sm font-medium">Service radius</label>
              <span className="text-sm text-muted-foreground">{radiusMiles} miles</span>
            </div>
            <input
              id="radius"
              type="range"
              min={10}
              max={500}
              step={10}
              value={radiusMiles}
              onChange={(e) => {
                setRadiusMiles(parseInt(e.target.value, 10));
                setRadiusTouched(true);
              }}
              className="w-full accent-primary"
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Categories</h2>
        <p className="text-sm text-muted-foreground">Pick all that apply — couples will filter by these.</p>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-colors ${
                selectedCategories.has(cat.id) ? 'border-primary bg-accent' : 'border-input hover:bg-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="rounded"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Hero photo</h2>
        <label className="flex items-center justify-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed cursor-pointer hover:border-primary transition-colors">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {heroFile ? heroFile.name : 'Click to upload (or drag and drop)'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
          />
        </label>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Your listing will be reviewed and live within 24 hours, on our free Basic plan.{' '}
          <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            See what Featured placement includes →
          </a>
        </p>
        <Button type="submit" size="lg" disabled={loading || !businessName || !description || !city || !state}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Listing
        </Button>
      </div>
    </form>
  );
}
