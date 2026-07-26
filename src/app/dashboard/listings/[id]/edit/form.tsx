'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/lib/types';

interface EditableListing {
  id: string;
  title: string;
  description: string;
  websiteUrl: string;
  city: string;
  state: string;
  serviceRadiusMiles: number;
  travelsNationwide: boolean;
}

interface Props {
  listing: EditableListing;
  categories: Category[];
  selectedCategoryIds: string[];
}

export function EditListingForm({ listing, categories, selectedCategoryIds }: Props) {
  const router = useRouter();
  const supabase = useSupabase();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [websiteUrl, setWebsiteUrl] = useState(listing.websiteUrl);
  const [city, setCity] = useState(listing.city);
  const [state, setState] = useState(listing.state);
  const [radiusMiles, setRadiusMiles] = useState(listing.serviceRadiusMiles);
  const [nationwide, setNationwide] = useState(listing.travelsNationwide);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedCategoryIds));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleCategory(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
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
          ...coordUpdate,
        })
        .eq('id', listing.id);
      if (updateErr) throw updateErr;

      // Replace category links wholesale — simplest correct approach for a
      // small, human-sized set of checkboxes.
      await supabase.from('listing_categories').delete().eq('listing_id', listing.id);
      if (selected.size > 0) {
        await supabase.from('listing_categories').insert(
          [...selected].map((categoryId) => ({ listing_id: listing.id, category_id: categoryId }))
        );
      }

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

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-colors ${
                selected.has(cat.id) ? 'border-primary bg-accent' : 'border-input hover:bg-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="rounded"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
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
