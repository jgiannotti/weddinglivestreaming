'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  CREW_OPTIONS,
  parsePriceInput,
  priceCentsToInput,
  type CrewType,
} from '@/lib/listing-facets';

interface EditableListing {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroImageUrl: string | null;
  websiteUrl: string;
  city: string;
  state: string;
  serviceRadiusMiles: number;
  travelsNationwide: boolean;
  startingPriceCents: number | null;
  crewType: CrewType | null;
}

interface Props {
  listing: EditableListing;
}

export function EditListingForm({ listing }: Props) {
  const router = useRouter();
  const supabase = useSupabase();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [websiteUrl, setWebsiteUrl] = useState(listing.websiteUrl);
  const [city, setCity] = useState(listing.city);
  const [state, setState] = useState(listing.state);
  const [radiusMiles, setRadiusMiles] = useState(listing.serviceRadiusMiles);
  const [nationwide, setNationwide] = useState(listing.travelsNationwide);
  const [startingPrice, setStartingPrice] = useState(priceCentsToInput(listing.startingPriceCents));
  const [priceError, setPriceError] = useState<string | null>(null);
  const [crewType, setCrewType] = useState<CrewType | ''>(listing.crewType ?? '');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const parsedPrice = parsePriceInput(startingPrice);
    if (parsedPrice.error) {
      setPriceError(parsedPrice.error);
      return;
    }
    setPriceError(null);

    setSaving(true);
    try {
      // (hoisted to the component body — hooks can't run inside a handler)

      const cityOrStateChanged = city !== listing.city || state !== listing.state;
      let coordUpdate: { lat?: number; lng?: number } = {};
      if (cityOrStateChanged) {
        try {
          const q = encodeURIComponent(`${city}, ${state}, USA`);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
          const data = await res.json();
          if (data[0]) coordUpdate = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } catch {
          /* keep existing coordinates if re-geocoding fails */
        }
      }

      // Upload the new cover photo first (if one was chosen), same bucket and
      // path scheme as the submit-listing form.
      let heroUpdate: { hero_image_url?: string } = {};
      if (heroFile) {
        const path = `listings/${listing.slug}-${Date.now()}-${heroFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('listings')
          .upload(path, heroFile, { upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from('listings').getPublicUrl(path);
        heroUpdate = { hero_image_url: pub.publicUrl };
      }

      // RLS ("vendor owners manage their listings") enforces ownership
      // server-side regardless of what this client sends.
      const { error: updateErr } = await supabase
        .from('listings')
        .update({
          title,
          description,
          website_url: websiteUrl || null,
          city,
          state,
          service_radius_miles: radiusMiles,
          travels_nationwide: nationwide,
          // Clearing the field is a real edit — send null rather than skipping
          // the column, so a vendor can withdraw a price they no longer honour.
          starting_price_cents: parsedPrice.cents,
          crew_type: crewType || null,
          ...heroUpdate,
          ...coordUpdate,
        })
        .eq('id', listing.id);
      if (updateErr) throw updateErr;

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Cover photo</h2>
        <p className="text-sm text-muted-foreground">
          The large photo at the top of your listing. If you haven&rsquo;t added one,
          couples see a generic stock photo instead of your work.
        </p>
        {(heroPreview || listing.heroImageUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPreview ?? listing.heroImageUrl ?? ''}
            alt="Listing cover"
            className="w-full max-h-56 object-cover rounded-xl border"
          />
        )}
        <div>
          <label htmlFor="heroFile" className="block text-sm font-medium mb-1.5">
            {listing.heroImageUrl || heroPreview ? 'Replace photo' : 'Upload a photo'}
          </label>
          <input
            id="heroFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setHeroFile(f);
              setHeroPreview(f ? URL.createObjectURL(f) : null);
            }}
            className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            JPG, PNG, or WebP. A wide photo of your actual work looks best. Saved when you hit Save changes.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Business details</h2>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">Business name *</label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
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
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1.5">Website</label>
          <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
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
            <Input id="state" required value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">How far will you travel?</h2>
        <p className="text-sm text-muted-foreground">
          Couples searching within this distance of {city || 'your city'} will find you.
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
            Both optional, and both filterable — couples can narrow the directory by starting price
            and crew size, and listings without them sit outside those filters.
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
              Your lowest wedding package. Clear the field to remove the price from your listing.
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

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="p-4 rounded-2xl bg-primary/10 text-primary text-sm border border-primary/20">
          Saved.
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
          Back to dashboard
        </Button>
        <Button type="submit" size="lg" disabled={saving || !title || !city || !state}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
