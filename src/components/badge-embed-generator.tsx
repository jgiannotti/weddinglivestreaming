'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SITE = 'https://www.weddinglivestreaming.com';

type Variant = 'light' | 'dark';

/**
 * Turn whatever a vendor pastes (full profile URL, "/listing/slug", or a bare
 * slug) into a canonical profile path. Falls back to the homepage when empty
 * so the snippet always works. Only same-site listing URLs are ever produced —
 * pasted text never ends up in the href verbatim.
 */
function toProfilePath(raw: string): string {
  const value = raw.trim();
  if (!value) return '/';
  // Full URL or path containing /listing/<slug>
  const match = value.match(/\/listing\/([a-z0-9-]+)/i);
  if (match) return `/listing/${match[1].toLowerCase()}`;
  // Bare slug — allow letters/numbers/hyphens only
  const slug = value.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (/^[a-z0-9-]+$/.test(slug)) return `/listing/${slug}`;
  return '/';
}

export function BadgeEmbedGenerator() {
  const [profileInput, setProfileInput] = useState('');
  const [variant, setVariant] = useState<Variant>('light');
  const [copied, setCopied] = useState(false);

  const profilePath = toProfilePath(profileInput);
  // Embed code must reference the production URL (it runs on the vendor's
  // site); the on-page preview loads the same asset relatively so it works
  // on previews/localhost too.
  const badgePath = `/badge/featured-on-wls${variant === 'dark' ? '-dark' : ''}.svg`;
  const badgeSrc = `${SITE}${badgePath}`;

  const embedCode = useMemo(() => {
    const href = `${SITE}${profilePath === '/' ? '' : profilePath}?utm_source=vendor-badge`;
    return [
      `<a href="${href}" target="_blank" rel="noopener">`,
      `  <img src="${badgeSrc}" alt="Featured on WeddingLiveStreaming.com" width="260" height="64" style="border:0" loading="lazy" />`,
      `</a>`,
    ].join('\n');
  }, [profilePath, badgeSrc]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, http) — the code is
      // visible and selectable below, so silent fallback is fine.
    }
  }

  return (
    <div className="rounded-3xl border bg-card p-6 md:p-8 space-y-6">
      <div>
        <label htmlFor="badge-profile" className="block font-semibold mb-2">
          Your profile URL or slug
        </label>
        <Input
          id="badge-profile"
          placeholder="e.g. weddinglivestreaming.com/listing/your-business-name"
          value={profileInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileInput(e.target.value)}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Find your profile in the{' '}
          <a href="/directory" className="text-primary hover:underline">directory</a> and paste its
          address here so the badge links straight to your listing.
        </p>
      </div>

      <div>
        <p className="font-semibold mb-2">Style</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Badge style">
          {(['light', 'dark'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={variant === v}
              onClick={() => setVariant(v)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                variant === v
                  ? 'border-primary text-primary bg-accent/50'
                  : 'bg-card hover:border-primary/50'
              }`}
            >
              {v === 'light' ? 'Light (ivory)' : 'Dark (plum)'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold mb-3">Preview</p>
        <div
          className={`rounded-2xl border p-6 flex justify-center ${
            variant === 'dark' ? 'bg-white' : 'bg-ink'
          }`}
        >
          {/* Shown against the opposite surface so the border/contrast is visible */}
          <Image src={badgePath} alt="Featured on WeddingLiveStreaming.com badge preview" width={260} height={64} unoptimized />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold">Embed code</p>
          <Button type="button" size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="rounded-xl bg-ink text-ink-foreground/90 text-xs md:text-sm p-4 overflow-x-auto whitespace-pre-wrap break-all">
          {embedCode}
        </pre>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste this into your website&rsquo;s footer, about page, or wherever you show off press
          and credentials.
        </p>
      </div>
    </div>
  );
}
