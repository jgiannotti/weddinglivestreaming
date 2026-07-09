'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { US_STATES } from '@/lib/states';

const BUDGET_OPTIONS = ['Under $500', '$500–$1,000', '$1,000–$2,500', '$2,500+'];

interface Props {
  venueState?: string;
  venueCity?: string;
  sourceListingId?: string;
  title?: string;
}

export function LeadForm({ venueState, venueCity, sourceListingId, title }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState(venueCity ?? '');
  const [state, setState] = useState(venueState ?? '');
  const [guestCount, setGuestCount] = useState('');
  // Radix Select can't use an empty string as an item value, so "unsure" is
  // the sentinel for "no budget preference" — translated back to '' below.
  const [budget, setBudget] = useState('unsure');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          wedding_date: weddingDate || undefined,
          venue_city: city || undefined,
          venue_state: state,
          guest_count: guestCount ? Number(guestCount) : undefined,
          budget: budget !== 'unsure' ? budget : undefined,
          message: message || undefined,
          source_listing_id: sourceListingId,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
        <p className="font-semibold mb-1">Thanks — you&rsquo;re all set!</p>
        <p className="text-sm text-muted-foreground">
          We&rsquo;ll connect you with matching wedding live streaming vendors shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-4">
      <h3 className="font-display text-xl font-semibold">
        {title ?? 'Get Free Quotes'}
      </h3>

      {/* Honeypot — hidden from sighted users, not display:none so it still
          renders in the DOM/tab order for basic bots, but visually hidden
          and skipped by screen readers via aria-hidden + tabIndex. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium mb-1.5">Name *</label>
          <Input id="lead-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium mb-1.5">Email *</label>
          <Input id="lead-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lead-phone" className="block text-sm font-medium mb-1.5">Phone</label>
          <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label htmlFor="lead-date" className="block text-sm font-medium mb-1.5">Wedding date</label>
          <Input id="lead-date" type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lead-city" className="block text-sm font-medium mb-1.5">Venue city</label>
          <Input id="lead-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label htmlFor="lead-state" className="block text-sm font-medium mb-1.5">Venue state *</label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger id="lead-state" className="rounded-md">
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lead-guests" className="block text-sm font-medium mb-1.5">Guest count</label>
          <Input
            id="lead-guests"
            type="number"
            min={0}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lead-budget" className="block text-sm font-medium mb-1.5">Budget</label>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger id="lead-budget" className="rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unsure">Not sure yet</SelectItem>
              {BUDGET_OPTIONS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="lead-message" className="block text-sm font-medium mb-1.5">Message</label>
        <textarea
          id="lead-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tell us about your wedding day plans…"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading || !name || !email || !state}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Get Free Quotes
      </Button>
    </form>
  );
}
