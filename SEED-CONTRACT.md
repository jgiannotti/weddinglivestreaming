# SEED-CONTRACT.md — how to insert scraped vendors into production

Contract between the **vendor-scraping workstream** (separate chat) and the live
site. The claim-your-profile system (migration `0008_claim_system.sql`, shipped
2026-07-10) is built around rows shaped exactly like this. Follow it and every
seeded vendor automatically gets: public visibility, an "Unclaimed profile"
label, a "Claim This Profile — Free" CTA on its listing page, and a hand-off
flow through `/admin/claims`.

## Connection

Use the **service role key** (bypasses RLS — anon inserts will be rejected).
- REST: `https://khqnbkqtfsdqdemxsrpz.supabase.co/rest/v1/` with `apikey` +
  `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` headers
- Direct SQL: pooler host `aws-1-us-west-2.pooler.supabase.com:5432`, user
  `postgres.khqnbkqtfsdqdemxsrpz` (the direct db.…supabase.co host is
  IPv6-only and unreachable from Joe's network)
- Keys/password: `.credentials.local.md` (never commit)

## Row shape

### 1. `vendors` — one per business
| column | value |
|---|---|
| `user_id` | **NULL** (this is what makes it claimable — never fabricate a user) |
| `business_name` | scraped name, cleaned (no "LLC" shouting, no trailing city) |
| `slug` | kebab-case, unique (`st-pete-wedding-streams`) |
| `bio` | optional short description if scraped; plain text, no HTML |
| `website_url` | canonical https URL if known — **important**: admins verify claims against this domain |
| `phone` | optional, E.164 or plain US format |
| `source` | `'seeded'` (required — distinguishes provenance forever) |
| `claimed_at` | leave NULL |

### 2. `listings` — one per business (multi-listing only if genuinely distinct services)
| column | value |
|---|---|
| `vendor_id` | the vendor row's id |
| `title` | usually the business name (this is the public card headline) |
| `slug` | unique kebab-case |
| `description` | 2–6 sentences. Write/paraphrase — do NOT paste copyrighted site copy verbatim |
| `city`, `state` | full state name (`Florida`, not `FL`) — state pages match on full name |
| `country` | `'US'` |
| `lat`, `lng` | look up from the `cities` table (17k rows, already seeded): `select lat,lng from cities where name ilike $city and state_code = $st` — do NOT geocode via Mapbox (ToS forbids storing results) |
| `status` | `'approved'` (they're real businesses; skipping the review queue is the point) |
| `tier` | `'basic'` |
| `expires_at` | `now() + interval '12 months'` |
| `service_radius_miles` | 60 default; 100+ for videography/production companies if their site says they travel |
| `travels_nationwide` | true only if their site explicitly says nationwide/destination |
| `hero_image_url` | leave NULL unless we have image rights — the UI has a placeholder. Do NOT hotlink scraped images |

### 3. `listing_categories` — at least one per listing
`(listing_id, category_id)` — the 6 categories are already seeded; match on
`categories.slug`: `budget-friendly`, `church-religious-ceremonies`,
`destination-weddings`, `full-service-production`,
`multi-camera-cinematic`, `solo-operator`. When unsure: `solo-operator` for
one-person outfits, `full-service-production` for companies.

## Hard rules

1. **Never create `auth.users` or `profiles` rows for seeded vendors.** The
   claim flow creates the account; `approve_claim_request()` attaches it.
2. **No verbatim copyrighted text, no hotlinked images.**
3. **Only real, currently-operating businesses** with a verifiable web
   presence — every listing page publicly says "Profile from public sources."
4. **Idempotency**: upsert on `slug` so re-runs don't duplicate.
5. After a batch, sanity-check `select count(*) from listings where status='approved'`
   and spot-check `/directory` + one `/listing/[slug]` page renders.

## What the site does with these rows (already live — don't rebuild)

- Listing page shows "Unclaimed profile" + claim CTA → `/claim/[listing-slug]`
- Claimant registers/signs in → submits proof → row in `claim_requests`
- Joe approves in `/admin/claims` → `approve_claim_request()` atomically sets
  `vendors.user_id`, `claimed_at`, upgrades the profile to `role='vendor'`,
  rejects competing claims. The vendor then manages the listing from the
  normal dashboard.
- Directory, radius search (uses `lat`/`lng`!), state pages, sitemap, and the
  homepage vendor-count stats all pick seeded rows up automatically.
