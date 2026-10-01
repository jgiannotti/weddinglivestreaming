'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { CREW_OPTIONS, parsePriceInput, type CrewType } from '@/lib/listing-facets';
import { US_STATES } from '@/lib/states';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { safeUploadName, slugCandidates, friendlySubmitError, photoProblem } from '@/lib/listing-submit';
import { FOUNDING_MONTHS } from '@/lib/founding-shared';

interface Props {
  userId: string;
  /**
   * Set when this account already has a vendor record but no listing: an
   * earlier attempt failed after its first step. The form then finishes that
   * attempt instead of starting a second vendor record.
   */
  resumeVendor?: { id: string; businessName: string; websiteUrl: string; phone: string } | null;
}

interface ExistingMatch {
  title: string;
  slug: string;
  city: string;
  state: string;
  claimed: boolean;
}

export function SubmitListingForm({ userId, resumeVendor = null }: Props) {
  const router = useRouter();
  // Supabase client carrying the caller's Clerk token, so the insert lands
  // under their own RLS identity rather than anonymously.
  const supabase = useSupabase();
  // The vendor row this page created, if a submit got that far and then
  // failed. A second click on Submit must reuse it, not create another one:
  // two vendor rows on one account is a state the dashboard cannot show.
  const createdVendorId = useRef<string | null>(null);
  const [businessName, setBusinessName] = useState(resumeVendor?.businessName ?? '');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(resumeVendor?.websiteUrl ?? '');
  const [phone, setPhone] = useState(resumeVendor?.phone ?? '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // "Is this business already in the directory?" The directory was seeded
  // from public sources, so the honest answer is often yes, and the right
  // move is to claim that profile rather than create a duplicate beside it.
  const [matches, setMatches] = useState<ExistingMatch[]>([]);
  const [confirmedDifferent, setConfirmedDifferent] = useState(false);

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

  // Looks for a live listing with the same business name or the same website.
  // Public data only (approved listings), so this needs no special access.
  async function findExisting(name: string, website: string): Promise<ExistingMatch[]> {
    const found = new Map<string, ExistingMatch>();
    const add = (rows: any[] | null) => {
      for (const r of rows ?? []) {
        found.set(r.slug, {
          title: r.title,
          slug: r.slug,
          city: r.city,
          state: r.state,
          claimed: Boolean(r.vendor?.user_id),
        });
      }
    };

    try {
      const trimmed = name.trim();
      if (trimmed.length >= 3) {
        // No wildcards: ilike here is a case-insensitive exact match.
        const exact = trimmed.replace(/[\\%_]/g, (m) => `\\${m}`);
        const { data } = await supabase
          .from('listings')
          .select('title, slug, city, state, vendor:vendors(user_id)')
          .eq('status', 'approved')
          .ilike('title', exact)
          .limit(3);
        add(data as any[] | null);
      }

      let host = '';
      try {
        host = website ? new URL(website).hostname.replace(/^www\./, '') : '';
      } catch { /* not a URL yet */ }
      // Skip shared hosts where the hostname says nothing about the business.
      if (host && !/(facebook|instagram|wixsite|squarespace|linktr|youtube|vimeo|google)\./i.test(host)) {
        const { data } = await supabase
          .from('listings')
          .select('title, slug, city, state, vendor:vendors(user_id)')
          .eq('status', 'approved')
          .ilike('website_url', `%${host.replace(/[\\%_]/g, (m) => `\\${m}`)}%`)
          .limit(3);
        add(data as any[] | null);
      }
    } catch {
      // A failed lookup must never block someone from listing their business.
    }
    return [...found.values()];
  }

  async function checkExisting() {
    if (confirmedDifferent) return;
    setMatches(await findExisting(businessName, websiteUrl));
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

    const photoIssue = photoProblem(heroFile);
    if (photoIssue) {
      setError(`${photoIssue} You can also skip it and add a photo later from your dashboard.`);
      return;
    }

    setLoading(true);
    try {
      // Stop before writing anything if this business is already listed and
      // the vendor has not told us it is a different one.
      if (!confirmedDifferent) {
        const existing = await findExisting(businessName, websiteUrl);
        if (existing.length > 0) {
          setMatches(existing);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      const slugs = slugCandidates(businessName, city, state);

      // 1. Vendor record: reuse the one from an interrupted earlier attempt,
      //    otherwise create it. The slug is unique, and a seeded profile may
      //    already hold the plain one, so walk the candidates on a conflict.
      let vendorId = resumeVendor?.id ?? createdVendorId.current;
      if (vendorId) {
        // Reusing the row from an earlier attempt (a previous visit, or a
        // submit that failed a moment ago). Bring its details up to date.
        await supabase
          .from('vendors')
          .update({ business_name: businessName, website_url: websiteUrl || null, phone: phone || null })
          .eq('id', vendorId);
      } else {
        let vendorErr: any = null;
        for (const slug of slugs) {
          const { data, error: err } = await supabase
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
          if (!err && data) {
            vendorId = (data as { id: string }).id;
            vendorErr = null;
            break;
          }
          vendorErr = err;
          if (err?.code !== '23505') break;
        }
        if (!vendorId) throw vendorErr ?? new Error('vendor insert failed');
        createdVendorId.current = vendorId;
      }

      // 2. Geocode city/state
      const coords = await geocode(city, state);

      // 3. Create the listing (before the photo, so a failed upload can no
      //    longer cost the vendor their whole submission).
      let listing: { id: string; slug: string } | null = null;
      let listingErr: any = null;
      for (const slug of slugs) {
        const { data, error: err } = await supabase
          .from('listings')
          .insert({
            vendor_id: vendorId,
            title: businessName,
            slug,
            description,
            hero_image_url: null,
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
        if (!err && data) {
          listing = data as { id: string; slug: string };
          listingErr = null;
          break;
        }
        listingErr = err;
        if (err?.code !== '23505') break;
      }
      if (!listing) throw listingErr ?? new Error('listing insert failed');

      // 4. Cover photo. Optional, and never fatal: if it fails the listing is
      //    still submitted and the vendor is told to add the photo later.
      let photoFailed = false;
      if (heroFile) {
        try {
          const path = `listings/${listing.slug}-${Date.now()}-${safeUploadName(heroFile.name)}`;
          const { error: uploadErr } = await supabase.storage
            .from('listings')
            .upload(path, heroFile, { upsert: false });
          if (uploadErr) throw uploadErr;
          const { data: pub } = supabase.storage.from('listings').getPublicUrl(path);
          const { error: heroErr } = await supabase
            .from('listings')
            .update({ hero_image_url: pub.publicUrl })
            .eq('id', listing.id);
          if (heroErr) throw heroErr;
        } catch (photoErr) {
          console.error('[submit-listing] photo upload failed', photoErr);
          photoFailed = true;
        }
      }

      // Update profile role to vendor. Direct role updates are blocked by
      // column-level grants (migration 0009 — privilege-escalation fix);
      // this SECURITY DEFINER function only ever does couple -> vendor on
      // the caller's own row.
      await supabase.rpc('become_vendor');

      // Tell the owner there is a listing waiting. Best effort.
      try {
        await fetch('/api/listings/submitted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: listing.id }),
        });
      } catch { /* the listing is saved either way */ }

      router.push(`/dashboard?welcome=1${photoFailed ? '&photo=failed' : ''}`);
      router.refresh();
    } catch (err) {
      console.error('[submit-listing] failed', err);
      setError(friendlySubmitError(err));
      setLoading(false);
    }
  }

  const unclaimedMatches = matches.filter((m) => !m.claimed);
  const claimedMatches = matches.filter((m) => m.claimed);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {resumeVendor && (
        <div className="rounded-2xl border bg-accent/30 px-5 py-4 text-sm">
          <strong>Welcome back.</strong> Your account is set up but your listing was never finished.
          Fill in the details below to submit it.
        </div>
      )}

      {matches.length > 0 && !confirmedDifferent && (
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 space-y-4" role="alert">
          <h2 className="font-display text-xl font-semibold">You may already be listed</h2>
          <ul className="space-y-3">
            {unclaimedMatches.map((m) => (
              <li key={m.slug} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <span className="text-sm">
                  <span className="font-semibold">{m.title}</span>
                  <span className="text-muted-foreground"> · {m.city}, {m.state}</span>
                </span>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={`/claim/${m.slug}`}>Claim this listing</Link>
                </Button>
              </li>
            ))}
            {claimedMatches.map((m) => (
              <li key={m.slug} className="rounded-xl border px-4 py-3 text-sm">
                <span className="font-semibold">{m.title}</span>
                <span className="text-muted-foreground"> · {m.city}, {m.state} · already claimed by its owner. </span>
                <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
                <span className="text-muted-foreground"> if that is your business and you did not claim it.</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Claiming is free and keeps your existing profile, instead of creating a second one.
          </p>
          <button
            type="button"
            onClick={() => { setConfirmedDifferent(true); setMatches([]); }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            This is a different business. Continue with a new listing.
          </button>
        </div>
      )}

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Business details</h2>

        <div>
          <label htmlFor="businessName" className="block text-sm font-medium mb-1.5">Business name *</label>
          <Input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            onBlur={checkExisting}
          />
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
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onBlur={checkExisting}
              placeholder="https://"
            />
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

      {/* The two fields below are what the founding-vendor offer asks for, so
          say so right where the vendor decides whether to fill them in. */}
      <p className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-sm">
        <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
        <span>
          <strong>Founding vendor offer:</strong> add a starting price and a cover photo, and once
          your listing is approved it is Featured free for {FOUNDING_MONTHS} months. No card needed.
        </span>
      </p>

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
        <h2 className="font-display text-xl font-semibold">Cover photo</h2>
        <label className="flex items-center justify-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed cursor-pointer hover:border-primary transition-colors">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {heroFile ? heroFile.name : 'Click to upload (or drag and drop)'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 15 MB. A wide photo of your actual work looks best. You can also add it later.
        </p>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          We review every new listing by hand, usually within 24 hours, and email you when it is
          live. Listing is free.{' '}
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
