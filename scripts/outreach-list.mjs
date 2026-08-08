// Builds a mail-merge CSV of seeded vendors who publish a contact email, for the
// claim-your-listing outreach described in OUTREACH-VENDOR-BADGE.md.
//
//   node scripts/outreach-list.mjs > outreach.csv
//
// Reads only local seed files and writes to stdout — it does not contact anyone.
// Emails here were collected from each vendor's own public website during seeding
// (each entry records its source URL). Regenerate when needed rather than
// committing the CSV, so a stale contact list never lingers in git.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'seed/vendors';
const SITE = 'https://www.weddinglivestreaming.com';

// Prefer a role address (info@, hello@) over a personal one where both exist —
// role addresses are the intended public contact and less intrusive to write to.
function pickEmail(emails) {
  const addresses = emails.map((e) => e?.address).filter(Boolean);
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

  const email = pickEmail(vendor.contact?.emails ?? []);
  if (!email) continue;

  const slug = vendor.identity?.suggested_slug;
  rows.push({
    business: vendor.identity?.business_name ?? '',
    first_name: firstName(vendor.identity?.owner_names),
    email,
    city: vendor.location?.hq_city ?? '',
    state: vendor.location?.hq_state ?? '',
    website: vendor.identity?.website ?? '',
    profile: slug ? `${SITE}/listing/${slug}` : '',
  });
}

rows.sort((a, b) => a.business.localeCompare(b.business));

const headers = ['business', 'first_name', 'email', 'city', 'state', 'website', 'profile'];
const lines = [headers.join(',')];
for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(','));

process.stdout.write(lines.join('\n') + '\n');

const named = rows.filter((r) => r.first_name).length;
const missingProfile = rows.filter((r) => !r.profile).length;
process.stderr.write(
  `${rows.length} vendors with a public email — ${named} have an owner first name` +
    (missingProfile ? `, ${missingProfile} missing a profile slug` : '') +
    '\n'
);
