'use client';

import { useState } from 'react';

// Copies a signed claim link (src/lib/claim-link.ts) so the owner can paste it
// into a reply to a vendor. A vendor who opens it and signs in is approved on
// the spot, with no form and no review queue.
export function CopyClaimLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; fall back to showing the link.
      window.prompt('Copy this claim link:', url);
    }
  }

  return (
    <button type="button" onClick={copy} className="text-primary hover:underline whitespace-nowrap">
      {copied ? 'Copied' : 'Copy claim link'}
    </button>
  );
}
