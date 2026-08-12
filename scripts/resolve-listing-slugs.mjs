// Maps each seed vendor file to its REAL live listing slug.
//
//   node scripts/resolve-listing-slugs.mjs
//
// Writes seed/listing-slugs.json ({ "<file>.json": "<live-slug>" }).
//
// Why this exists: seed records carry `identity.suggested_slug`, which is what
// the seeding pass proposed — not necessarily what the importer created. About
// a quarter of them differ (usually a missing state suffix, sometimes a
// different city), so linking a vendor to their "profile" using the suggested
// slug sends 1 in 4 to a 404. Outreach that does that is worse than no
// outreach, so we resolve against the live sitemap and only ever emit a URL
// that actually resolved.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'seed/vendors';
const OUT = 'seed/listing-slugs.json';
const SITEMAP = 'https://www.weddinglivestreaming.com/sitemap.xml';

const res = await fetch(SITEMAP, { headers: { 'user-agent': 'wls-slug-resolver' } });
if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
const xml = await res.text();

const liveSlugs = [...xml.matchAll(/<loc>[^<]*\/listing\/([^<]+)<\/loc>/g)].map((m) => m[1]);
if (liveSlugs.length === 0) throw new Error('no listing URLs found in sitemap');
console.error(`${liveSlugs.length} live listing slugs in sitemap`);

const liveSet = new Set(liveSlugs);
const tokenize = (slug) => slug.split('-').filter(Boolean);

// US state suffixes and generic city noise carry little identifying signal, so
// matching leans on the business-name tokens that lead every slug.
const STATE_CODES = new Set(
  ('al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ' +
    'ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy dc')
    .split(' ')
);

function score(a, b) {
  const ta = tokenize(a);
  const tb = tokenize(b);
  // Leading-token agreement is the strongest signal — the business name.
  let lead = 0;
  while (lead < ta.length && lead < tb.length && ta[lead] === tb[lead]) lead++;

  const sa = new Set(ta.filter((t) => !STATE_CODES.has(t)));
  const sb = new Set(tb.filter((t) => !STATE_CODES.has(t)));
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  const union = new Set([...sa, ...sb]).size || 1;

  return lead * 10 + (shared / union) * 5;
}

const mapping = {};
const unresolved = [];

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  let vendor;
  try {
    vendor = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch {
    continue;
  }
  const suggested = vendor.identity?.suggested_slug;
  if (!suggested) {
    unresolved.push([file, '(no suggested_slug)']);
    continue;
  }

  if (liveSet.has(suggested)) {
    mapping[file] = suggested;
    continue;
  }

  let best = '';
  let bestScore = 0;
  for (const slug of liveSlugs) {
    const s = score(suggested, slug);
    if (s > bestScore) {
      bestScore = s;
      best = slug;
    }
  }

  // Require at least two matching leading tokens. Below that the "match" is
  // usually a coincidental shared word like "productions" or "weddings", and a
  // wrong profile link is as damaging as a missing one.
  if (bestScore >= 20) {
    mapping[file] = best;
  } else {
    unresolved.push([file, suggested]);
  }
}

writeFileSync(OUT, JSON.stringify(mapping, null, 2) + '\n');

console.error(`resolved ${Object.keys(mapping).length} vendors to a live slug`);
console.error(`unresolved: ${unresolved.length}`);
for (const [file, sug] of unresolved.slice(0, 15)) {
  console.error(`  ${file.replace(/\.json$/, '')}  (suggested: ${sug})`);
}
console.error(`\nWrote ${OUT}`);
