// Builds a mail-merge CSV of seeded vendors who publish a contact email, for the
// claim-your-listing outreach described in OUTREACH-VENDOR-BADGE.md.
//
//   node scripts/outreach-list.mjs > outreach.csv
//
// Reads only local seed files and writes to stdout — it does not contact anyone.
// Emails here were collected from each vendor's own public website during seeding
// (each entry records its source URL). Regenerate when needed rather than
// committing the CSV, so a stale contact list never lingers in git.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'seed/vendors';
const ENRICHED = 'seed/enriched-emails.json';
const SLUGS = 'seed/listing-slugs.json';
const SITE = 'https://www.weddinglivestreaming.com';

// Addresses recovered by scripts/enrich-emails.mjs for vendors whose seed record
// had no email. Merged in below, with the seed value always winning.
const enriched = existsSync(ENRICHED) ? JSON.parse(readFileSync(ENRICHED, 'utf8')) : {};

// Real live listing slugs from scripts/resolve-listing-slugs.mjs. `suggested_slug`
// in the seed data is only a proposal and 404s for roughly a quarter of vendors,
// so we never build a profile URL from it.
const liveSlugs = existsSync(SLUGS) ? JSON.parse(readFileSync(SLUGS, 'utf8')) : {};

// Seed files carry emails in two shapes depending on when they were scraped:
// a plain string, or {address, type, name, source}. Normalise both.
function toAddress(entry) {
  if (typeof entry === 'string') return entry.trim();
  return typeof entry?.address === 'string' ? entry.address.trim() : '';
}

// Prefer a role address (info@, hello@) over a personal one where both exist —
// role addresses are the intended public contact and less intrusive to write to.
function pickEmail(emails) {
  const addresses = emails.map(toAddress).filter(Boolean);
  const role = addresses.find((a) => /^(info|hello|contact|bookings?|sales|studio)@/i.test(a));
  return role ?? addresses[0] ?? '';
}

// First name for the greeting, when the seed captured an owner. Falls back to
// empty so the merge can use a neutral "Hi there" rather than printing a
// placeholder — a visible [First name] is what makes outreach read as spam.
function firstName(owners) {
  const first = (owners ?? []).find(Boolean);
  return first ? String(first).trim().split(/\s+/)[0] : '';
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const rows = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  let vendor;
  try {
    vendor = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch {
    continue;
  }

  const seedEmail = pickEmail(vendor.contact?.emails ?? []);
  const email = seedEmail || enriched[file]?.email || '';
  if (!email) continue;

  // Only a slug verified against the live sitemap becomes a profile link.
  // Everyone else gets the claim page, where they can search for themselves —
  // a working generic link beats a personalised 404.
  const slug = liveSlugs[file];
  rows.push({
    business: vendor.identity?.business_name ?? '',
    first_name: firstName(vendor.identity?.owner_names),
    email,
    city: vendor.location?.hq_city ?? '',
    state: vendor.location?.hq_state ?? '',
    website: vendor.identity?.website ?? '',
    profile: slug ? `${SITE}/listing/${slug}` : `${SITE}/claim`,
    email_source: seedEmail ? 'seed' : 'enriched',
    has_profile: slug ? 'yes' : 'no',
  });
}

rows.sort((a, b) => a.business.localeCompare(b.business));

// Some vendors share an address (rebrands, or one operator running two brands).
// Collapse to one row per address so nobody receives the same email twice, and
// note the other businesses so the merge can mention both listings.
const byEmail = new Map();
for (const row of rows) {
  const key = row.email.toLowerCase();
  const seen = byEmail.get(key);
  if (!seen) {
    byEmail.set(key, { ...row, also_listed: '' });
    continue;
  }
  seen.also_listed = [seen.also_listed, row.business].filter(Boolean).join(' | ');
}
const deduped = [...byEmail.values()];
const duplicatesCollapsed = rows.length - deduped.length;

const headers = [
  'business',
  'first_name',
  'email',
  'city',
  'state',
  'website',
  'profile',
  'email_source',
  'has_profile',
  'also_listed',
];
const lines = [headers.join(',')];
for (const row of deduped) lines.push(headers.map((h) => csvCell(row[h])).join(','));

process.stdout.write(lines.join('\n') + '\n');

const named = deduped.filter((r) => r.first_name).length;
const fromSeed = deduped.filter((r) => r.email_source === 'seed').length;
const missingProfile = deduped.filter((r) => r.has_profile === 'no').length;
process.stderr.write(
  `${deduped.length} unique recipients (${fromSeed} from seed, ${deduped.length - fromSeed} enriched) — ` +
    `${named} have an owner first name` +
    (duplicatesCollapsed ? `, ${duplicatesCollapsed} duplicate address(es) collapsed` : '') +
    (missingProfile ? `, ${missingProfile} missing a profile slug` : '') +
    '\n'
);
