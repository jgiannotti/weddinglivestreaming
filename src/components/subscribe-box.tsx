'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  source?: string;
}

export function SubscribeBox({ source = 'footer' }: Props) {
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
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" />
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

      <div className="flex items-center gap-2">
        <label htmlFor="subscribe-email" className="sr-only">Your email</label>
        <Input
          id="subscribe-email"
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 max-w-[220px]"
        />
        <Button type="submit" size="sm" disabled={loading || !email}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Subscribe
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
