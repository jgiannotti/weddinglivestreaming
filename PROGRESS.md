# PROGRESS — live checkpoint (updated 2026-07-07, session 2)

Read this first if resuming EXECUTE-ONESHOT.md in a new session.

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

- **GitHub push:** the Supabase-wiring commit is sitting locally, unpushed.
  GitHub wants sudo-mode re-auth (passkey/password) to mint a new push token,
  which only Joe's device can satisfy. Easiest fix: Joe just runs
  `git push origin main` himself from Terminal in this folder (his machine
  already has git credentials cached) — takes 10 seconds. Otherwise, next
  session can retry minting a token via Chrome if Joe approves the sudo prompt
  when it appears.
- **PayPal login** (see above).
- **Resend cost decision** (see above) — not strictly a blocker for launch,
  Stripe-only checkout works fine, but no transactional email (contact forms,
  password resets, lead notifications) will send until this is resolved.

## Still pending (unchanged scope from EXECUTE-ONESHOT.md)

Phases 5 (SEO/AEO), 6 (monetization expansion), 6B (admin panel), 6C (quality
bar), 6D (security audit), 7 (DNS cutover), 8 (search console + final report).
None of these are blocked — all can proceed once Joe unblocks the two items
above, or even before (they don't depend on git push or PayPal/Resend).

## Next session should

1. Check whether Joe pushed the commit; if not and sudo-mode is approved, mint
   a fresh short-lived PAT via github.com/settings/personal-access-tokens,
   push, then revoke it (same pattern as the prior session's temp PAT).
2. Verify the Stripe deployment finished and run the checkout verify loop.
3. Move into Phase 5 (SEO/AEO) — this is pure code, no dashboard dependencies,
   good use of a fresh context window.
