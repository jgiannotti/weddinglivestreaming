'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';
import { CREW_OPTIONS, parsePriceInput, type CrewType } from '@/lib/listing-facets';
import { US_STATES } from '@/lib/states';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface Props {
  userId: string;
}

export function SubmitListingForm({ userId }: Props) {
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
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Coverage radius. The old pre-fill guessed a starting number from the
  // vendor's category picks; with categories retired every vendor starts at
  // the same 60 miles and moves the slider themselves.
  const [radiusMiles, setRadiusMiles] = useState(60);
  const [nationwide, setNationwide] = useState(false);

  // Vendor-declared filters (migration 0014). Both optional — a vendor who
  // skips them still gets a complete listing, just no price/crew badge and no
  // presence in those filters.
  const [startingPrice, setStartingPrice] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [crewType, setCrewType] = useState<CrewType | ''>('');

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

    // Validate before creating anything — a bad price would otherwise fail at
    // the listing insert, after the vendor row and hero upload already landed.
    const parsedPrice = parsePriceInput(startingPrice);
    if (parsedPrice.error) {
      setPriceError(parsedPrice.error);
      return;
    }
    setPriceError(null);

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
      const { error: listingErr } = await supabase
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
          starting_price_cents: parsedPrice.cents,
          crew_type: crewType || null,
        })
        .select('id, slug')
        .single();
      if (listingErr) throw listingErr;

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
          Couples searching within this distance of your city will find you. Adjust it to fit how
          you actually work.
        </p>

        <label className="flex items-center gap-2 px-3 py-2.5 rounded-full border cursor-pointer hover:bg-muted transition-colors w-fit">
          <input
            type="checkbox"
            checked={nationwide}
            onChange={(e) => setNationwide(e.target.checked)}
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
              onChange={(e) => setRadiusMiles(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold">Pricing &amp; crew</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Both optional — but couples filter on them, so filling them in puts you in front of
            people who already know what they&rsquo;re looking for.
          </p>
        </div>

        <div>
          <label htmlFor="startingPrice" className="block text-sm font-medium mb-1.5">
            Packages start at
          </label>
          <div className="relative max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              id="startingPrice"
              inputMode="decimal"
              value={startingPrice}
              onChange={(e) => {
                setStartingPrice(e.target.value);
                if (priceError) setPriceError(null);
              }}
              placeholder="1200"
              className="pl-7"
              aria-invalid={priceError ? true : undefined}
              aria-describedby={priceError ? 'startingPrice-error' : 'startingPrice-help'}
            />
          </div>
          {priceError ? (
            <p id="startingPrice-error" className="text-xs text-destructive mt-1.5">{priceError}</p>
          ) : (
            <p id="startingPrice-help" className="text-xs text-muted-foreground mt-1.5">
              Your lowest wedding package. Shown as &ldquo;From $1,200&rdquo; — leave blank to show no price.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">Crew size</legend>
          <div className="space-y-2">
            {CREW_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  crewType === option.value ? 'border-primary bg-accent' : 'border-input hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="crewType"
                  checked={crewType === option.value}
                  onChange={() => setCrewType(option.value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
          {crewType && (
            <button
              type="button"
              onClick={() => setCrewType('')}
              className="text-xs text-muted-foreground hover:text-foreground underline mt-2"
            >
              Clear selection
            </button>
          )}
        </fieldset>
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
