# LAUNCH-REPORT.md

Running log for the EXECUTE-ONESHOT.md autonomous launch plan. Updated as work happens, not just at the end. See `PROGRESS.md` for the short "resume here" checkpoint — this file is the detailed record.

---

## State found (Phase 1 recon, 2026-07-07)

- **weddinglivestreaming.com** (production domain) serves a **GoDaddy parking page**, not the old WordPress/HivePress site. Confirmed via direct HTTP probes (homepage, `/lander`, `/wp-admin`, `/wp-login.php`, `robots.txt`, `sitemap.xml`) and a Wayback Machine availability check. No vendor data is recoverable by scraping — the old site is gone, not just redesigned.
- The actual live app was deployed on Vercel at `weddinglivestreaming.vercel.app`, not yet pointed at by the domain.
- **Bigger finding:** the deployed app itself was never wired to the real Supabase database. Every public page (homepage, directory, listing detail, state pages, contact page, sitemap.xml) was rendering from `src/data/mock-listings.ts` — 10 hardcoded fake vendors. This had nothing to do with the missing WP migration; it was a gap from initial scaffolding.
- Supabase project existed with the full schema migrated (`profiles`, `vendors`, `categories`, `listings`, `listing_categories`, `listing_photos`, `messages`, `favorites`, `claim_requests`, `reports`, `subscriptions`) and RLS policies in place, but **zero real listings** — the "104+ Verified Vendors" and "40+ States Covered" stats shown on the homepage and in meta descriptions were entirely fabricated placeholder copy from the original build, not derived from any real count.
- GitHub repo (`jgiannotti/weddinglivestreaming`) had 4 unpushed build-fix commits already sitting locally from a prior session.

**Decision (Joe, 2026-07-07):** proceed without the old WP data. Vendor re-acquisition is a future outreach project, not a data-migration task. Phase 2 closed on that basis.

---

## Phase 2 — Vendor migration: closed, no data migrated

Nothing to migrate — see above. Not a blocker for launch; the site works correctly with zero listings (empty states added everywhere) and will populate as real vendors sign up or are outreached.

---

## Ad-hoc fix — Wire public site to live Supabase data (2026-07-07)

Not in the original phase list, but blocking: shipping the site as-is would have shown 10 fake vendors forever, which is worse than an honest "just getting started" empty state.

- New `src/lib/data/listings.ts`: async, RLS-scoped (anon client) data layer — `getListings`, `getFeaturedListings`, `getListingBySlug`, `getVendorBySlug`, `getListingsByVendor`, `getListingStats`, `getRelatedListings`. Every query filters `status = 'approved'`.
- Rewired: `src/app/page.tsx`, `src/app/directory/page.tsx`, `src/app/listing/[slug]/page.tsx`, `src/app/listing/[slug]/contact/page.tsx`, `src/app/wedding-live-streaming-[state]/page.tsx`, `src/app/sitemap.ts` — all now query Supabase instead of `mock-listings.ts`.
- Removed the false "104+ Verified Vendors / 40+ States Covered" hardcoded stat line; homepage now shows real counts via `getListingStats()` and hides the stat pill entirely when the count is 0, instead of lying.
- Corrected meta descriptions in `layout.tsx` and `directory/page.tsx` that also claimed "100+ vendors."
- `src/data/mock-listings.ts` left in place but fully unused — safe to delete in a future cleanup pass.
- Verified via independent subagent build (`tsc --noEmit` 0 errors, `npm run build` succeeded) plus my own code review and a repo-wide grep confirming zero remaining references to mock data in `src/app`.
- **Committed** (`0371231`). **Not yet pushed** — see Blockers.

---

## Phase 3 — Resend transactional email: blocked

Joe's existing Resend account (`joe@quickcrew.tv`) is on the free plan, capped at 1 verified domain, already used by `quickcrew.tv`. Adding `weddinglivestreaming.com` needs either:

- the $20/mo Resend Pro plan on the existing account, or
- a new, separate free Resend account under a different email (I can't create accounts on Joe's behalf).

**Needs Joe's call.** Not a hard launch blocker — the site works without transactional email — but contact-form notifications, password resets, and lead alerts won't send until this is resolved.

---

## Phase 4 — Payments: Stripe done (test mode), PayPal blocked

**Stripe:**
- New standalone Stripe account "WeddingLiveStreaming" (`acct_1Tqa2LLAj1lYEdsf`), deliberately separate from Joe's other businesses.
- Product "Featured Listing": $29/mo and $199/yr test-mode prices.
- Webhook destination `wls-production` → `https://weddinglivestreaming.vercel.app/api/webhooks/stripe`, listening for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- All 5 required env vars added to Vercel and the app redeployed.
- **Bug found and fixed during verification:** triggered a real `checkout.session.completed` test event via Stripe's own Workbench shell and it failed delivery with **HTTP 308** every time. Root cause: `next.config.mjs` had `trailingSlash: true` (originally added to preserve old WordPress URL shapes for SEO), which 308-redirects *every* request — including API routes. Stripe's webhook sender does not follow redirects, so signed webhook POSTs were silently failing outright, every time, forever, with no code-level bug anywhere near the webhook handler itself.
  - Since Phase 2 closed without recovering any old WP URLs, there's nothing left to preserve — removed `trailingSlash: true`. This also matches `sitemap.ts`, which already emits non-trailing-slash URLs, so it removes a wasted redirect hop on every page view too. Would have equally broken PayPal and Resend webhooks once those were wired up.
  - **Committed** (`f593fbf`). **Not yet pushed / not yet live** — same blocker as above. Once deployed, re-run the Stripe test-event trigger and confirm a `200` in Event deliveries before trusting the checkout flow end-to-end.
- Not activated for live charges — no bank account, EIN, or identity info entered (Hard Gate G5, Joe's action when ready to go live).
- Full credentials in `.credentials.local.md`.

**PayPal:** blocked — `developer.paypal.com` session in Chrome is logged out and requires Joe's password (Hard Gate G1). Needs Joe to log in, then PayPal setup can resume per the plan's §4.

---

## Blockers needing Joe (3 items)

1. **Git push.** Two commits are sitting locally, unpushed to `origin/main`:
   - `0371231` — wires the public site to live Supabase data (replaces fake mock listings)
   - `f593fbf` — fixes the Stripe webhook 308-redirect bug
   GitHub requires sudo-mode re-authentication (passkey or password) to mint a new push credential, which only Joe's device/passkey can satisfy — I hit this wall twice and correctly stopped both times rather than trying to enter a password. **Fastest fix: Joe runs `git push origin main` himself from Terminal in this project folder** (his machine already has git credentials cached) — takes about 10 seconds and unblocks both fixes going live. Until this happens, **the production site is still running on fake vendor data and the Stripe integration is still broken.**
2. **PayPal login** (see Phase 4 above).
3. **Resend cost decision** (see Phase 3 above) — not launch-blocking, but no transactional email works until resolved.

---

## Scope change (Joe, 2026-07-07)

- **PayPal dropped entirely.** Stripe-only for payments — do not build or revisit PayPal.
- **Resend deferred, not dropped.** Joe will set up email himself first; only resume Resend/domain-verification work once he says that's done.

## Phase 5 — SEO hardening + AEO layer: done

1. **Crawl/indexing:** `robots.ts` now explicitly allows GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, and Bingbot (previously only had a generic `*` rule). Added `/llms.txt` (`src/app/llms.txt/route.ts`) — a markdown index of core pages, guides, and top states for AI answer engines, with live vendor/state counts pulled at request time (never hardcoded).
2. **Canonical tags:** added `alternates.canonical` to every static page, the homepage, directory, every listing, every state page, every new city page, and every guide — each pointing at itself with no query params (directory canonicalizes to `/directory` regardless of filter/sort/page params, avoiding duplicate-content across filter combinations). Deliberately did NOT set a root-layout-level default canonical, since Next.js metadata inheritance would have silently applied it to every page that didn't override it — that would have wrongly claimed the homepage as canonical for the whole site.
3. **Structured data — was built earlier but never wired in.** Found that `ListingJsonLd` and `OrganizationJsonLd` existed in `src/components/json-ld.tsx` from an earlier build pass but were never imported anywhere — zero schema was actually shipping. Fixed, and expanded the file with: `WebsiteJsonLd` (Organization + WebSite/SearchAction, added to root layout so every page gets them), `BreadcrumbJsonLd` (listing/state/city pages), `ListingsItemListJsonLd` (directory/state/city grids), `FaqJsonLd`, `ArticleJsonLd`, and `HowToJsonLd` (guide pages).
4. **Answer-first guide content (4 new pages under `/guides/`):** `wedding-live-streaming-cost`, `how-to-live-stream-a-wedding`, `diy-vs-professional-wedding-livestream`, `questions-to-ask-your-wedding-livestreamer`. Real, honest, non-templated content with pricing tables, FAQ/Article/HowTo schema, and a `data-affiliate-slot="diy-app"` placeholder on the DIY-app comparison for a future affiliate swap. Linked from the footer (new "Guides" section) and added to `sitemap.ts`.
5. **Per-state answer-first content:** every one of the 50 state pages now has a unique 40-60 word intro and 3-4 FAQs (`src/lib/state-content.ts`) — genuinely state-specific (climate/connectivity/venue angles), not a mail-merge template, and none of it invents a vendor count (the directory currently has zero real listings; any count claim would be false). Rendered with `FaqJsonLd`.
6. **Fixed a real stat bug found while doing this:** the state-page vendor count was capped at the same `limit: 9` used for the on-page grid, so it would have shown "9+" forever even once a state had 50 real vendors. Now counts the full unfiltered set separately from the 9-item preview grid.
7. **Programmatic city pages:** new route `/wedding-live-streaming-[state]/[city]`, dynamically generated only for (state, city) pairs that have ≥1 real approved listing (queried live, `getCitiesWithListings()` in `src/lib/data/listings.ts`) — a city with zero vendors 404s instead of shipping a thin/empty page. Added to `sitemap.ts`. Currently generates **zero pages** since there are zero real listings yet; the infrastructure is correct and will populate automatically as vendors get approved.
8. **Not done in this pass:** 5a's "diff old-site URLs for 301 parity" is moot — there are no old-site URLs to preserve (Phase 2 confirmed the WP data is gone). `www` → apex redirect is a Vercel domain-setting, not app code — deferred to Phase 7 (DNS cutover).

Verification note: this sandbox's `node_modules` is broken (incomplete install, `npm install` hits `ENOTEMPTY` errors and can't finish within the 45s-per-command sandbox limit — background processes also don't survive between commands here). Two subagents independently verified their own output (guide pages, state-content.ts) via scratch toolchains with `tsc --noEmit` clean. Everything else was verified by direct code review and cross-checking every new import against its actual export. Recommend running a real `npm run build` from Joe's own machine (or once pushed, Vercel's build log) as the final confirmation.

## Still pending

Phase 6 (monetization expansion), Phase 6B (admin command center), Phase 6C (quality bar: PSI, OG images, /terms, a11y, analytics), Phase 6D (security audit), Phase 7 (DNS cutover at GoDaddy), Phase 8 (search console + this report's final write-up). None of these are blocked by the git-push item above and can proceed in a future session.

---

*This report will be updated as later phases complete. See PROGRESS.md for the short version.*
