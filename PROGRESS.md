# PROGRESS — live checkpoint (updated 2026-07-07, session 2)

Read this first if resuming EXECUTE-ONESHOT.md in a new session.

## Latest: found + fixed a real Stripe webhook bug (still unpushed)

Triggered a live `checkout.session.completed` test event via Stripe's Workbench
shell to verify the webhook end-to-end. It failed every time with **HTTP 308**.
Root cause: `next.config.mjs` had `trailingSlash: true` (leftover from
preserving old WP URL shapes — moot now that Phase 2 closed without recovering
any WP data), which redirects *every* request including API routes. Stripe
doesn't follow redirects on webhook delivery, so it was failing silently and
would have kept failing forever. Removed `trailingSlash: true`, committed as
`f593fbf`. **Not yet pushed** — same git-push blocker as `0371231` below.
Full writeup in LAUNCH-REPORT.md.

## Since the last checkpoint

1. **Old WordPress site is gone.** weddinglivestreaming.com now serves a GoDaddy
   domain-parking page, not the old HivePress site. No vendor data is recoverable
   by scraping. Joe confirmed (2026-07-07): proceed without it. Phase 2 (vendor
   migration) is closed — see LAUNCH-REPORT.md. Vendor re-acquisition is a future
   outreach project, not a data-migration task.
2. **Found and fixed a bigger problem than the missing migration:** the entire
   public site (homepage, directory, listing detail, state pages, contact page,
   sitemap.ts) was still rendering from `src/data/mock-listings.ts` — 10
   hardcoded fake vendors — never wired to the real Supabase database at all.
   Fixed: new `src/lib/data/listings.ts` queries Supabase live (anon+RLS client).
   Homepage's "104+ Verified Vendors / 40+ States" stat line was hardcoded and
   false — now pulls real counts and hides itself when zero. Committed locally
   (commit `0371231`, NOT yet pushed — see blockers below).
3. **Stripe (Phase 4): done, test mode.** New standalone Stripe account
   "WeddingLiveStreaming" (acct_1Tqa2LLAj1lYEdsf) — separate from Joe's other
   businesses. Product "Featured Listing" with $29/mo + $199/yr prices. Webhook
   endpoint live at /api/webhooks/stripe listening for checkout.session.completed,
   customer.subscription.updated/deleted. All 5 env vars set in Vercel + redeployed
   (deployment dpl_7rJPXXURhSSPcYjRg8kLxjqvgBbU was building at last check — verify
   it finished and re-run the checkout test-mode verify loop: 4242 4242 4242 4242
   card → confirm listing flips to featured → cancel → confirm it flips back).
   Full credentials in `.credentials.local.md`.
4. **PayPal (Phase 4): blocked.** developer.paypal.com session in Chrome is
   logged out — needs Joe to log in, then resume PayPal setup per
   EXECUTE-ONESHOT.md §4.
5. **Resend (Phase 3): blocked on a cost decision.** Joe's existing Resend
   account (joe@quickcrew.tv) is on the free plan — 1 domain max, already used by
   quickcrew.tv. Adding weddinglivestreaming.com needs either the $20/mo Pro plan
   or a brand-new free Resend account under a different email (I can't create
   accounts on Joe's behalf). Needs Joe's call — see LAUNCH-REPORT.md.

## Blockers needing Joe (only 2 right now)

- **GitHub push:** two commits are sitting locally, unpushed —
  `0371231` (Supabase wiring) and `f593fbf` (Stripe webhook 308 fix).
  GitHub wants sudo-mode re-auth (passkey/password) to mint a new push token,
  which only Joe's device can satisfy — confirmed twice now. Easiest fix: Joe
  just runs `git push origin main` himself from Terminal in this folder (his
  machine already has git credentials cached) — takes 10 seconds and makes
  the real vendor data AND the Stripe fix go live. Otherwise, next session
  can retry minting a token via Chrome if Joe approves the sudo prompt when
  it appears.
- **PayPal login** (see above).
- **Resend cost decision** (see above) — not strictly a blocker for launch,
  Stripe-only checkout works fine, but no transactional email (contact forms,
  password resets, lead notifications) will send until this is resolved.

## Still pending (unchanged scope from EXECUTE-ONESHOT.md)

Phases 5 (SEO/AEO), 6 (monetization expansion), 6B (admin panel), 6C (quality
bar), 6D (security audit), 7 (DNS cutover), 8 (search console + final report).
None of these are blocked — all can proceed once Joe unblocks the two items
above, or even before (they don't depend on git push or PayPal/Resend).

## Scope change (Joe, 2026-07-07)

- PayPal dropped entirely — Stripe only.
- Resend deferred — Joe sets up email himself first, then we create a new account.

## Phase 5 (SEO/AEO) — done this session

robots.ts AI-crawler allowlist, /llms.txt, canonical tags on every page, wired
up the previously-unused json-ld.tsx schema (+ added Website/Breadcrumb/
ItemList/Faq/Article/HowTo variants), 4 real guide pages under /guides/,
unique per-state intro+FAQ content (src/lib/state-content.ts, all 50 states),
programmatic city pages (currently generate 0 pages since there are 0 real
listings — infra is correct and will populate once vendors exist). Full
details in LAUNCH-REPORT.md. Committed as `<fill in after commit>`.

## Next session should

1. Check whether Joe pushed the commits; if not and sudo-mode is approved, mint
   a fresh short-lived PAT via github.com/settings/personal-access-tokens,
   push, then revoke it (same pattern as the prior session's temp PAT).
2. Verify the Stripe deployment finished and run the checkout verify loop.
3. Move into Phase 6 (monetization expansion) or 6B (admin panel) — both are
   pure code, no dashboard dependencies, good use of a fresh context window.
