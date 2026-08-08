'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SITE = 'https://www.weddinglivestreaming.com';

interface CiteThisProps {
  /** Canonical path of the page being cited, e.g. "/guides/...". */
  path: string;
  /** Page title as it should appear in a citation. */
  title: string;
  /** Headline figure a blogger would quote, e.g. "$950". */
  statValue: string;
  /** What the figure measures, e.g. "national median starting price". */
  statLabel: string;
  /** Publication year of the dataset. */
  year: number;
  /** ISO date the data was last regenerated. */
  updated: string;
}

function CopyBlock({
  label,
  hint,
  code,
  mono = false,
}: {
  label: string;
  hint: string;
  code: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, non-https). The text is
      // visible and selectable below, so a silent fallback is fine.
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy} className="flex-none">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre
        className={`rounded-xl border bg-accent/20 p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words ${
          mono ? 'font-mono text-xs leading-relaxed' : 'leading-relaxed'
        }`}
      >
        {code}
      </pre>
    </div>
  );
}

/**
 * Citation kit for original-data pages. A journalist or blogger on deadline
 * cites whatever is easiest to paste — "you're welcome to cite us" earns far
 * fewer links than a pre-formatted citation and a ready-made embed. Both
 * snippets carry a plain followed link back to the source page.
 */
export function CiteThis({
  path,
  title,
  statValue,
  statLabel,
  year,
  updated,
}: CiteThisProps) {
  const url = `${SITE}${path}`;

  const plain = `${statValue} — ${statLabel} for professional wedding livestreaming in the U.S. (WeddingLiveStreaming.com, ${year}). Source: ${url}`;

  const apa = `WeddingLiveStreaming.com. (${year}). ${title}. Retrieved ${updated}, from ${url}`;

  const embed = [
    '<figure style="margin:1.5rem 0;padding:1.25rem 1.5rem;border-left:4px solid #b08d57;background:#faf7f2;">',
    `  <p style="margin:0;font-size:1.75rem;font-weight:700;color:#2b2620;">${statValue}</p>`,
    `  <p style="margin:.35rem 0 0;color:#6b6157;">${statLabel} for a professional wedding livestream in the U.S.</p>`,
    '  <figcaption style="margin-top:.75rem;font-size:.85rem;color:#8a7d6d;">',
    `    Source: <a href="${url}" style="color:#b08d57;">WeddingLiveStreaming.com ${year} vendor pricing study</a>`,
    '  </figcaption>',
    '</figure>',
  ].join('\n');

  return (
    <div className="rounded-3xl border bg-card p-6 md:p-8 space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">Cite this data</h2>
        <p className="text-muted-foreground leading-relaxed">
          Free to reuse for any purpose, including commercially, with attribution and a link to
          the source page. No permission request needed — copy whichever format fits.
        </p>
      </div>

      <CopyBlock
        label="Quick citation"
        hint="For an article, newsletter, or social post."
        code={plain}
      />

      <CopyBlock
        label="Academic citation"
        hint="APA-style, for papers and reports."
        code={apa}
      />

      <CopyBlock
        label="Embeddable stat callout"
        hint="Paste into any blog post or CMS — renders a styled callout with attribution."
        code={embed}
        mono
      />

      <p className="text-sm text-muted-foreground">
        Need a state-level breakdown, a custom cut of the data, or a quote for a story?{' '}
        <a href="/press" className="underline underline-offset-4 hover:text-primary">
          See the press page
        </a>{' '}
        — we respond to journalist requests within one business day.
      </p>
    </div>
  );
}
