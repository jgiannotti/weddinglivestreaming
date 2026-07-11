// Backfill vendor_private_contacts from seed/vendors/*.json.
//
// Matches each seed file to a DB vendor by slug (identity.suggested_slug)
// first, then by website domain. Upserts scraped public email / phone /
// contact-form URL. Idempotent — safe to re-run after new seed batches.
//
// Usage: node scripts/backfill-vendor-contacts.mjs
// Required env (reads .env.local automatically): NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY

import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

// CJS interop: the installed @supabase/supabase-js build only ships a .cjs
// entry, which plain ESM `import` can't always resolve directly.
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

// Minimal .env.local loader (no dotenv dependency).
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

const { data: vendors, error } = await supabase
  .from('vendors')
  .select('id, slug, business_name, website_url, user_id');
if (error) {
  console.error('Failed to load vendors:', error.message);
  process.exit(1);
}

const bySlug = new Map(vendors.map((v) => [v.slug, v]));
const byDomain = new Map();
for (const v of vendors) {
  const d = v.website_url ? domainOf(v.website_url) : null;
  if (d && !byDomain.has(d)) byDomain.set(d, v);
}

const seedDir = 'seed/vendors';
let matched = 0, withEmail = 0, unmatched = [];

for (const file of readdirSync(seedDir).filter((f) => f.endsWith('.json'))) {
  let seed;
  try {
    seed = JSON.parse(readFileSync(path.join(seedDir, file), 'utf8'));
  } catch {
    continue;
  }
  const slug = seed?.identity?.suggested_slug;
  const website = seed?.identity?.website;
  const contact = seed?.contact ?? {};

  const vendor =
    (slug && bySlug.get(slug)) ||
    (website && byDomain.get(domainOf(website))) ||
    null;
  if (!vendor) {
    unmatched.push(file);
    continue;
  }
  matched++;

  const email = (contact.emails ?? [])[0] || null;
  const phone = (contact.phones ?? [])[0] || null;
  if (email) withEmail++;

  const { error: upsertErr } = await supabase.from('vendor_private_contacts').upsert(
    {
      vendor_id: vendor.id,
      public_email: email,
      public_phone: phone,
      contact_form_url: contact.contact_form_url || null,
      source: 'seed-scrape',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'vendor_id' }
  );
  if (upsertErr) console.error(`  upsert failed for ${file}: ${upsertErr.message}`);
}

console.log(`Seed files matched to vendors: ${matched}`);
console.log(`  with a public email: ${withEmail}`);
console.log(`Unmatched seed files: ${unmatched.length}`);
for (const f of unmatched) console.log(`  - ${f}`);
