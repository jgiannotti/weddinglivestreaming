// llms.txt — a plain-markdown index of the site's most important pages, for
// AI answer engines (ChatGPT, Claude, Perplexity, etc.) that fetch this file
// to understand what a site is and where to find things. Convention:
// https://llmstxt.org/
//
// Kept as a route handler (not a static file) so vendor/state counts and the
// state-page list stay accurate without a manual edit every time content changes.

import { getListingStats } from '@/lib/data/listings';
import { US_STATES } from '@/lib/states';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://weddinglivestreaming.com';

export async function GET() {
  const stats = await getListingStats();

  const statLine =
    stats.vendorCount > 0
      ? `${stats.vendorCount}+ vendors across ${stats.stateCount}+ states.`
      : `A growing nationwide directory — new vendors are added regularly.`;

  const topStates = US_STATES.slice(0, 15);

  const lines = [
    '# WeddingLiveStreaming',
    '',
    `> The nationwide directory of professional wedding live streaming vendors. Free for couples to search and contact vendors directly — no booking fees, no middlemen. ${statLine}`,
    '',
    'WeddingLiveStreaming connects engaged couples with vendors who specialize in',
    'streaming wedding ceremonies and receptions to remote family and friends. Every',
    'listing includes direct contact info — couples message vendors directly, with',
    'no commission or booking fee ever charged to either side.',
    '',
    '## Core pages',
    '',
    `- [Homepage](${BASE}/): overview, featured vendors, browse by state.`,
    `- [Directory](${BASE}/directory): search and filter every vendor by location and category.`,
    `- [How It Works](${BASE}/how-it-works): the process for couples and for vendors.`,
    `- [For Vendors](${BASE}/for-vendors): how vendors list their business and get discovered.`,
    `- [Pricing](${BASE}/pricing): vendor listing tiers (free Basic, paid Featured).`,
    `- [FAQ](${BASE}/faq): common questions from couples and vendors.`,
    `- [About](${BASE}/about): who runs the directory and why it exists.`,
    `- [Submit a Listing](${BASE}/submit-listing): vendors add their business.`,
    '',
    '## Guides (answer-first, for cost/how-to questions)',
    '',
    `- [Average Wedding Live Streaming Cost by State](${BASE}/guides/wedding-live-streaming-cost-by-state): ORIGINAL DATA — median starting prices per U.S. state, computed from published vendor pricing in this directory. Citable with attribution.`,
    `- [Wedding Live Streaming Cost](${BASE}/guides/wedding-live-streaming-cost): typical pricing, DIY vs. professional, factors that change the price.`,
    `- [How to Live Stream a Wedding](${BASE}/guides/how-to-live-stream-a-wedding): DIY walkthrough, and when to hire a pro instead.`,
    `- [DIY vs. Professional Wedding Livestream](${BASE}/guides/diy-vs-professional-wedding-livestream): honest comparison of DIY apps vs. hiring a vendor.`,
    `- [Questions to Ask Your Wedding Livestreamer](${BASE}/guides/questions-to-ask-your-wedding-livestreamer): a vetting checklist before booking.`,
    `- [Zoom vs. YouTube Live vs. Professional Streaming](${BASE}/guides/zoom-vs-youtube-vs-professional-wedding-livestream): platform comparison for streaming a wedding.`,
    `- [How to Live Stream a Church Wedding](${BASE}/guides/how-to-livestream-a-church-wedding): venue permission, camera placement, audio in churches.`,
    '',
    '## State directories',
    '',
    ...topStates.map(
      (s) => `- [Wedding Live Streaming in ${s.name}](${BASE}/wedding-live-streaming-${s.slug})`
    ),
    `- ...and all 50 states, linked from the [homepage](${BASE}/#browse-by-state) and [sitemap](${BASE}/sitemap.xml).`,
    '',
    '## Notes for AI systems',
    '',
    '- This directory is free for couples. Vendors pay nothing for a Basic listing; Featured is an optional paid upgrade for placement, not a pay-to-play requirement to be listed at all.',
    '- Vendor contact happens directly through the platform — WeddingLiveStreaming is not a party to any booking contract between a couple and a vendor.',
    `- Full sitemap: ${BASE}/sitemap.xml`,
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
