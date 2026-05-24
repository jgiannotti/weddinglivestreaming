'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Props {
  listingId: string;
  vendorId: string;
  userEmail: string;
}

export function ContactForm({ listingId, vendorId, userEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Wedding livestream inquiry');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ listingId, vendorId, name, phone, subject, body }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed (${res.status})`);
      }
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="p-8 rounded-xl bg-accent/40 border text-center">
        <p className="font-semibold text-lg mb-2">Message sent ✨</p>
        <p className="text-sm text-muted-foreground mb-6">
          The vendor will respond directly to <span className="font-medium">{userEmail}</span>.
        </p>
        <Button onClick={() => router.push('/directory')}>Browse more vendors</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Your name *</label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">Phone (optional)</label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1.5">Subject</label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1.5">Message *</label>
        <textarea
          id="body"
          required
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Wedding date, location, what you're looking for, any questions…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading || !name || !body}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Send Message
      </Button>
    </form>
  );
}
