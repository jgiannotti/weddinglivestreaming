# PROGRESS — live checkpoint (updated 2026-07-07, session 2)

Read this first if resuming EXECUTE-ONESHOT.md in a new session. Full detail on everything below is in `LAUNCH-REPORT.md`.

## Blocker needing Joe (1 item — the only thing blocking everything else)

**GitHub push.** Three commits are sitting locally, unpushed to `origin/main`:

- `0371231` — wires the public site to live Supabase data (replaces fake mock listings with real DB queries)
- `f593fbf` — fixes a Stripe webhook bug (308 redirect from `trailingSlash:true` was silently failing every webhook delivery)
- `b73e51b` — Phase 5 SEO/AEO: guide pages, per-state content, structured data, robots/llms.txt, canonical tags, city-page infra

GitHub requires sudo-mode re-authentication (passkey/password) to mint a new push token, which only Joe's device can satisfy — confirmed blocked on this twice now. **Fastest fix: Joe runs `git push origin main` himself** from Terminal in this project folder (his machine already has git credentials cached) — takes about 10 seconds and makes all three fixes go live. Until this happens, **the production site is still running on fake vendor data and Stripe is still broken.**

## Scope decisions (Joe, 2026-07-07)

- **PayPal: dropped entirely.** Stripe only. Do not build or revisit PayPal.
- **Resend: deferred, not dropped.** Joe is setting up email himself first. Only resume Resend/domain-verification work once he says that's done — don't ask again in the meantime.

## What's done

1. **Old WordPress site confirmed gone** (GoDaddy parking page, no recoverable data). Joe approved proceeding without it — vendor re-acquisition is a future outreach project, not a migration task. Phase 2 closed.
2. **Wired the live site to real Supabase data** — it was rendering 10 hardcoded fake vendors the whole time, unrelated to the missing WP migration. New `src/lib/data/listings.ts`, false "104+ vendors" stat line replaced with real (or hidden-if-zero) counts.
3. **Stripe: done, test mode.** Standalone account, products/prices, webhook created. The webhook was silently failing (308 redirect bug) — found via Stripe's own test-event tool, root-caused to `next.config.mjs`, fixed. Full credentials in `.credentials.local.md`.
4. **Phase 5 (SEO/AEO): done.** AI-crawler robots allowlist, `/llms.txt`, canonical tags everywhere, wired up structured data that existed but was never imported (zero schema was shipping before this), 4 real guide pages, unique per-state intro+FAQ content for all 50 states, programmatic city-page infrastructure (0 pages today since there are 0 real listings — will populate once vendors exist).

## Still pending (unchanged scope)

Phase 6 (monetization expansion), 6B (admin command center), 6C (quality bar: PSI/OG images/terms page/a11y/analytics), 6D (security audit), 7 (DNS cutover), 8 (search console + final report). None of these are blocked by the git-push item — all can proceed in a future session even before Joe pushes.

## Next session should

1. Check whether Joe pushed the 3 commits above; if not and GitHub sudo-mode is approved, mint a fresh short-lived PAT via github.com/settings/personal-access-tokens, push, then revoke it.
2. Once pushed: verify the Vercel deploy finished, re-run the Stripe checkout verify loop, spot-check a couple of guide pages and state pages render correctly in production.
3. Move into Phase 6 (monetization expansion) or 6B (admin panel) — both are pure code, no dashboard dependencies.
