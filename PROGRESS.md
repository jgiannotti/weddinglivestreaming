# PROGRESS — live checkpoint (updated 2026-07-09, Milestone 2 session)

Read this first if resuming in a new session. Full detail on everything below is in `LAUNCH-REPORT.md`.

## Blocker needing Joe (1 item — the only thing blocking everything else)

**GitHub push.** This sandbox cannot push to GitHub (confirmed blocked repeatedly — GitHub requires
sudo-mode re-auth only Joe's device can satisfy). All work is committed locally; **Joe needs to run
`git push origin main`** from Terminal in this project folder. As of this session, local `main` is at
`53e1179` ("feat(location): Milestone 2 — tiered radius search & location intelligence"), 4 commits
ahead of whatever `origin/main` currently has. Until pushed, **production is still running the old
broken city/state string-match search** — the whole point of Milestone 2 isn't live yet.

After Joe pushes: 1) confirm the Vercel deploy succeeds (this sandbox couldn't get a real
build/typecheck signal — see "Known sandbox quirks" below), 2) redeploy once more or just let the
push trigger it, since `NEXT_PUBLIC_MAPBOX_TOKEN` was already added to Vercel env vars this session
and needs a fresh build to take effect.

## Known sandbox quirks (read before fighting these again)

- **git in this sandbox:** every git command that writes the index (`add`, `commit`, `status`) leaves
  a stray `.git/index.lock` (or `HEAD.lock`) behind — the FUSE bridge to Joe's real folder allows
  `rename()` but denies `unlink()`, so git's own lock-cleanup step fails with "Operation not
  permitted" even though the actual git operation (add/commit) succeeds. Fix each time: `mv
  .git/index.lock .git/index` (if it's the real just-written index) or `mv .git/index.lock
  .git/_stray_safe_to_delete` (if it's just a leftover empty lock from a read-only `status`) — never
  `rm` it, `rm` fails the same way `git` does. This is a sandbox-only artifact; Joe's own native git
  on his Mac is unaffected.
- **`npm run build`/`npm install`/`tsc`:** still broken here (incomplete `node_modules`, no `tsc`
  binary, network install doesn't finish in the 45s sandbox command limit). The `deploy_to_vercel` MCP
  tool was tried as a workaround (upload the file tree directly, bypass git) but this codebase (~430KB
  across ~110 files) is too large to fit in that tool's single-call payload — 9 attempts all failed
  with `Module not found` errors from a truncated file list, not real bugs (confirmed via
  `get_deployment_build_logs`; no production deployment was touched). **Verify TypeScript/build
  correctness via careful manual code review (ideally a subagent doing an independent pass) until
  Joe pushes and Vercel's native GitHub build runs.**
- **`next.config.mjs` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`**
  (pre-existing, not set this session). Worth knowing: even a green Vercel build only proves
  syntax/module-resolution is clean, not that there are zero type errors.

## Scope decisions (Joe, 2026-07-07)

- **PayPal: dropped entirely.** Stripe only. Do not build or revisit PayPal.
- **Resend: deferred, not dropped.** Joe is setting up email himself first. Only resume Resend/domain-verification work once he says that's done — don't ask again in the meantime.

## What's done

**Launch (Phases 1-8):** old WordPress site confirmed gone; live site wired to real Supabase data;
Stripe test mode; SEO/AEO layer (guides, per-state content, structured data, sitemap/llms.txt);
monetization (leads + subscribers); admin command center; quality bar (favicon/OG/terms/a11y); security
audit (PayPal exploit closed, RLS hardened, XSS escaped, CVE patched); DNS cutover — **site is live in
production at weddinglivestreaming.com.** Full detail in `LAUNCH-REPORT.md`.

**Milestone 2 — Location intelligence (this session, 2026-07-09): code complete, committed locally,
not yet pushed/live.** Replaced the broken `ilike` city/state string-match search (a St. Petersburg
vendor could never appear in a Tampa search) with a real tiered geo search: own-DB cities/ZIP backbone
(17,102 cities + 41,488 ZIPs from GeoNames, live in production Supabase already — this part IS live,
it's just unused until the app code ships), vendor coverage-radius settings, a Postgres function doing
tier1 (covers you) → tier2 (same-state fallback) → tier3 (nationwide) ranked search, and a rebuilt
autocomplete search bar. Verified end-to-end live against production (temp test vendor + listing,
deleted after — see LAUNCH-REPORT.md for the exact proof). Security re-audit found and fixed one gap
(`/api/geo/nearest` was missing rate limiting). UX audit (Phase F) found and fixed a real bug (tier2/3
results rendered with no section header when tier1 was empty — looked like false "covers you" matches)
plus a few smaller fixes (loading skeleton, tap target, honest disabled-state on non-functional
buttons). Mapbox public token obtained and set in Vercel + `.env.local` + `.credentials.local.md`.

## Still pending

- **Push + deploy Milestone 2** (see blocker above) — this is the main thing standing between "code
  complete" and "actually fixes the bug for real users."
- Everything from the original launch list that was already deferred: Resend (blocked on Joe's
  decision), Stripe going live for real charges (Hard Gate G5, needs Joe's bank/EIN info), Bing
  Webmaster Tools sitemap submission, storage bucket policy version-control.
- Milestone-3 candidates logged during this session's UX audit (not built, deliberately out of scope):
  a real favorites/shortlist system, reconciling the two inconsistent contact paths on listing pages
  (one requires sign-in, one doesn't), ZIP-code live autocomplete suggestions (full ZIP entry works,
  just no suggest-as-you-type), and making the "Claim Listing"/"Report" buttons functional.

## Next session should

1. Check whether Joe pushed `53e1179` (or later) to `origin/main`. If not, that's still the blocker.
2. Once pushed: verify the Vercel deploy succeeded (real build/typecheck signal, which this sandbox
   couldn't get — see "Known sandbox quirks" above), click through the St. Pete → Tampa search live
   in a browser, spot-check mobile autocomplete.
3. Redeploy/trigger a fresh build if needed so `NEXT_PUBLIC_MAPBOX_TOKEN` (already set in Vercel env
   vars) actually takes effect.
4. Run a real PageSpeed/Lighthouse check on `/directory` and a city page once live — couldn't be done
   this session since there was nothing deployed yet to test (the whole feature was still local/
   unpushed) and this sandbox has no way to run Lighthouse against a non-existent build. Confirm the
   new autocomplete JS doesn't tank mobile performance, per the original Phase G ask.
