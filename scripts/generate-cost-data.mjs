// Generates src/lib/data/cost-by-state.generated.json from seed/vendors/*.json.
//
// This powers /guides/wedding-live-streaming-cost-by-state — the "our own data"
// page from SEO-AEO-PLAN.md §5. Re-run quarterly (or after each seed import
// batch) and commit the regenerated JSON:
//
//   node scripts/generate-cost-data.mjs
//
// Only vendors with a *published, parseable dollar figure* count toward the
// stats — pricing_notes prose ("contact for a quote") is ignored, so every
// number on the page traces to a real price a vendor publishes on their own
// site (sources are recorded in each seed file's pricing.packages[].source).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR_DIR = join(ROOT, 'seed', 'vendors');
const OUT = join(ROOT, 'src', 'lib', 'data', 'cost-by-state.generated.json');

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

function parsePrice(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const m = v.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    if (m) return parseFloat(m[0]);
  }
  return null;
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function quantile(nums, q) {
  const s = [...nums].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
}

const round25 = (n) => Math.round(n / 25) * 25;

const rows = [];
let totalVendors = 0;
for (const file of readdirSync(VENDOR_DIR).filter((f) => f.endsWith('.json'))) {
  totalVendors += 1;
  const d = JSON.parse(readFileSync(join(VENDOR_DIR, file), 'utf8'));
  const p = d.pricing ?? {};
  const state = d.location?.hq_state ?? null;
  const pkgPrices = (p.packages ?? []).map((x) => parsePrice(x.price)).filter(Boolean);
  let lo = parsePrice(p.price_range_low) ?? parsePrice(p.starting_price) ?? (pkgPrices.length ? Math.min(...pkgPrices) : null);
  let hi = parsePrice(p.price_range_high) ?? (pkgPrices.length ? Math.max(...pkgPrices) : null);
  if (lo != null && lo < 50) lo = null; // junk guard (e.g. per-hour add-on fragments)
  if (lo == null || !state || !STATE_NAMES[state]) continue;
  rows.push({ state, lo, hi: hi ?? lo });
}

const startPrices = rows.map((r) => r.lo);
const byState = new Map();
for (const r of rows) {
  if (!byState.has(r.state)) byState.set(r.state, []);
  byState.get(r.state).push(r);
}

const states = [...byState.entries()]
  .map(([code, rs]) => ({
    code,
    name: STATE_NAMES[code],
    vendorCount: rs.length,
    medianStart: round25(median(rs.map((r) => r.lo))),
    minStart: Math.round(Math.min(...rs.map((r) => r.lo))),
    maxHigh: Math.round(Math.max(...rs.map((r) => r.hi))),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const data = {
  generatedAt: new Date().toISOString().slice(0, 10),
  dataYear: new Date().getFullYear(),
  sampleSize: rows.length,
  directorySize: totalVendors,
  stateCount: states.length,
  national: {
    medianStart: round25(median(startPrices)),
    p25Start: round25(quantile(startPrices, 0.25)),
    p75Start: round25(quantile(startPrices, 0.75)),
    minStart: Math.round(Math.min(...startPrices)),
    maxHigh: Math.round(Math.max(...rows.map((r) => r.hi))),
  },
  states,
};

writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(
  `Wrote ${OUT}: ${data.sampleSize} priced vendors across ${data.stateCount} states; ` +
    `national median start $${data.national.medianStart} (IQR $${data.national.p25Start}–$${data.national.p75Start})`
);
