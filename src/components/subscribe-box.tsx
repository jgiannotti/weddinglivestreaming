'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  source?: string;
  /** Renders the pill-embedded style for the dark (ink) footer surface. */
  dark?: boolean;
}

export function SubscribeBox({ source = 'footer', dark = false }: Props) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className={cn('flex items-center gap-1.5 text-sm', dark ? 'text-ink-foreground/80' : 'text-muted-foreground')}>
        <CheckCircle2 className={cn('h-4 w-4', dark ? 'text-gold' : 'text-primary')} />
        You&rsquo;re subscribed!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Honeypot — hidden from sighted users, mirrors lead-form.tsx pattern. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="subscribe-website">Website</label>
        <input
          id="subscribe-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div
        className={cn(
          'flex items-center gap-1 rounded-full p-1.5 max-w-sm',
          dark ? 'bg-white/10 border border-white/15' : 'border bg-card shadow-sm'
        )}
      >
        <label htmlFor="subscribe-email" className="sr-only">Your email</label>
        <input
          id="subscribe-email"
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            'h-9 flex-1 min-w-0 bg-transparent px-4 text-sm focus-visible:outline-none',
            dark ? 'text-ink-foreground placeholder:text-ink-foreground/50' : 'placeholder:text-muted-foreground'
          )}
        />
        <Button type="submit" size="sm" disabled={loading || !email} className="shrink-0">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Subscribe
        </Button>
      </div>
      {error && (
        <p className={cn('text-xs', dark ? 'text-red-300' : 'text-destructive')}>{error}</p>
      )}
    </form>
  );
}
