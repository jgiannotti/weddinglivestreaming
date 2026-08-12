// Enriches the seed vendor list by looking for a public contact email on the
// vendors' own websites — the same way the original seeding collected them.
//
//   node scripts/enrich-emails.mjs            # scrape vendors with no email yet
//   node scripts/enrich-emails.mjs --limit 10 # try a small batch first
//
// Writes seed/enriched-emails.json ({ slugOrFile: {email, source, foundAt} }).
// Seed files are left untouched, so this is re-runnable and reversible; the
// outreach list generator merges this file over the seed data.
//
// Politeness: one request at a time per site, a small concurrency cap, a real
// timeout, and a User-Agent that says who we are and how to be removed. Only
// public pages are fetched and only addresses a business publishes for contact
// are kept.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'seed/vendors';
const OUT = 'seed/enriched-emails.json';
const UA =
  'WeddingLiveStreamingBot/1.0 (+https://www.weddinglivestreaming.com/about; directory listing verification; hello@weddinglivestreaming.com)';
const CONCURRENCY = 5;
const TIMEOUT_MS = 12_000;
const PATHS = ['', '/contact', '/contact-us', '/about', '/contact.html'];

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

function toAddress(entry) {
  if (typeof entry === 'string') return entry.trim();
  return typeof entry?.address === 'string' ? entry.address.trim() : '';
}

// Addresses that are technically well-formed but are never a business contact:
// analytics/CDN noise, placeholder text, and asset filenames that look like
// emails. Keeping these would mean emailing a vendor at a Wix crash reporter.
const JUNK = [
  /@(sentry|wixpress|sentry\.wixpress)\./i,
  // Theme/template placeholders. Matches any *domain.com variant (mydomain,
  // yourdomain, domain) — a real vendor never publishes these.
  /@([a-z]*domain|example|email|test|sample|placeholder|company|website)\.(com|org|net)$/i,
  /@(squarespace|godaddy|wix|shopify|cloudflare|jquery|gravatar)\./i,
  /\.(png|jpe?g|gif|svg|webp|css|js)$/i,
  /^[0-9a-f]{16,}@/i, // hashed/tracking addresses
  /@sentry\.io$/i,
  /(no-?reply|do-?not-?reply)@/i,
];

function isJunk(email) {
  return JUNK.some((re) => re.test(email));
}

function decodeEntities(html) {
  return html
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function extractEmails(html, siteHost) {
  const text = decodeEntities(html);
  const found = new Set();

  // mailto: links are the strongest signal — a human deliberately published it.
  for (const m of text.matchAll(/mailto:([^"'?>\s]+)/gi)) {
    const e = m[1].trim().toLowerCase();
    if (e.includes('@') && !isJunk(e)) found.add(e);
  }
  for (const m of text.matchAll(EMAIL_RE)) {
    const e = m[0].trim().toLowerCase().replace(/\.$/, '');
    if (!isJunk(e)) found.add(e);
  }

  const all = [...found];
  // Strongly prefer an address on the vendor's own domain — a gmail scraped
  // from a footer credit is often the web designer's, not the vendor's.
  const onDomain = all.filter((e) => siteHost && e.endsWith(`@${siteHost}`));
  const roleOnDomain = onDomain.filter((e) =>
    /^(info|hello|contact|bookings?|sales|studio|admin|office)@/i.test(e)
  );
  return { best: roleOnDomain[0] ?? onDomain[0] ?? all[0] ?? '', all };
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
    });
    if (!res.ok) return '';
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function enrichVendor(vendor) {
  const site = vendor.identity?.website;
  if (!site) return null;
  const host = hostOf(site);
  const base = site.replace(/\/+$/, '');

  for (const path of PATHS) {
    const url = `${base}${path}`;
    const html = await fetchText(url);
    if (!html) continue;
    const { best } = extractEmails(html, host);
    if (best) return { email: best, source: url, foundAt: new Date().toISOString() };
  }
  return null;
}

// --- gather targets -------------------------------------------------------

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};

const targets = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  let vendor;
  try {
    vendor = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch {
    continue;
  }
  const hasEmail = (vendor.contact?.emails ?? []).map(toAddress).some(Boolean);
  if (hasEmail) continue;
  if (existing[file]) continue; // already attempted in a previous run
  if (!vendor.identity?.website) continue;
  targets.push({ file, vendor });
}

const batch = targets.slice(0, LIMIT);
console.error(
  `${targets.length} vendors without an email and with a website; scraping ${batch.length}`
);

// --- run with a small concurrency pool ------------------------------------

let done = 0;
let hits = 0;
const results = { ...existing };

async function worker(queue) {
  while (queue.length) {
    const { file, vendor } = queue.shift();
    const found = await enrichVendor(vendor);
    done++;
    if (found) {
      hits++;
      results[file] = found;
      console.error(`  [${done}/${batch.length}] ${found.email}  <- ${vendor.identity?.business_name ?? file}`);
    } else {
      results[file] = { email: '', source: '', foundAt: new Date().toISOString() };
      if (done % 10 === 0) console.error(`  [${done}/${batch.length}] ...`);
    }
  }
}

const queue = [...batch];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n');
console.error(`\nFound ${hits} new email addresses out of ${batch.length} attempted.`);
console.error(`Wrote ${OUT} (attempted vendors are recorded either way, so re-runs skip them).`);
