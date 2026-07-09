# EXECUTE-ONESHOT.md — Autonomous Launch Plan for weddinglivestreaming.com

> **How to use this file (Joe):** Open a FRESH Claude chat (Sonnet is fine) in Cowork mode with this
> project folder selected and Chrome connected. Paste exactly this one line:
>
> **"Read EXECUTE-ONESHOT.md in the project folder and execute it fully. Do not stop to ask me anything unless you hit a Hard Gate defined in the file."**
>
> Then walk away. The agent does the rest and leaves you a final report in `LAUNCH-REPORT.md`.

---

## 0. WHO YOU ARE AND HOW YOU OPERATE (read first, agent)

You are the development firm Joe hired. You have **full ownership**. Joe is non-technical and wants
humans out of the loop. Operating rules:

1. **Never wait for permission** except at the Hard Gates in §9. Everything else: decide, do, verify, move on.
2. **Verify-loop everything.** After every deploy or config change: fetch the live URL / run the check →
   if broken, fix and redeploy → repeat until the acceptance check passes. Max 5 loops per item; after 5,
   log the failure in LAUNCH-REPORT.md and move to the next item. Never silently skip verification.
3. **Idempotent resume.** Before doing any step, check whether it's already done (query the DB, list env
   vars, fetch the URL). This file may be re-run after a crash — never duplicate data or break working state.
4. **State discovery before action.** Phase 1 is mandatory reconnaissance. Do not trust this file's
   snapshot of state — verify it.
5. **Free tier only.** Never enable anything that bills. If a step would cost money, log it as a
   recommendation in LAUNCH-REPORT.md instead.
6. **Credentials via Chrome.** Joe is logged into **Supabase, Vercel, GoDaddy (registrar + DNS),
   Stripe, and Resend** in Chrome. Use the Claude-in-Chrome tools to navigate their dashboards and copy keys/values. Store
   secrets ONLY in `.credentials.local.md` (gitignored — verify it is) and in Vercel env vars. Never
   commit a secret. Never paste a secret into chat.
7. **Use your task list tool** to mirror the phases below, and write progress notes into
   `LAUNCH-REPORT.md` as you go, not just at the end.
8. **Auth decision — FINAL, do not revisit:** the app uses **Supabase Auth**, which is already wired
   into the database permission layer (RLS) on every table, with the admin user created. Joe also has
   a Clerk account, but **do NOT migrate to Clerk** — swapping auth mid-launch touches every protected
   page and RLS policy for zero user-visible gain and real breakage risk. If login UX ever needs an
   upgrade post-launch, evaluate Clerk then as its own milestone. Note this decision in LAUNCH-REPORT.md.
9. **Context & continuity (this is a long run — plan for it):**
   - Maintain `PROGRESS.md` as a live checkpoint: after every completed phase, write what's done,
     what's next, and any credentials/IDs created (by reference to `.credentials.local.md`, never
     inline). If your context runs low or the session dies, Joe restarts a fresh chat with the SAME
     one-line kickoff prompt — Phase 1 recon + PROGRESS.md makes resumption seamless.
   - **Delegate bulk content to subagents.** The guide articles (Phase 5d), state-page intros/FAQs
     (5d.5), and city pages (5e) are context-heavy. Spawn subagents to write them to files and return
     only summaries, keeping your main context for orchestration and verification.
10. **Tool preference order:** Vercel MCP tools (if connected) > Chrome browser tools > computer use.
   For Supabase SQL, use the SQL Editor via Chrome, or the Supabase Management API with an access
   token retrieved from the dashboard (Account → Access Tokens) — your choice, whichever verifies faster.

### Known state snapshot (verify in Phase 1, don't trust blindly)
- **Repo:** https://github.com/jgiannotti/weddinglivestreaming (Next.js 15 App Router, ~76 files, builds clean)
- **Vercel:** project id `prj_9Qj6LOOmFsEaiJPvqyYsMXymXLew`, team `joes-projects-82cbf60c` (Hobby). Production live at https://weddinglivestreaming.vercel.app
- **Supabase:** project `khqnbkqtfsdqdemxsrpz` (West US Oregon). Schema applied (migrations 0001+0002), RLS on, 6 categories seeded, `listings` storage bucket (public), admin user joe@floridasoundman.com (role=admin). Credentials in `.credentials.local.md`.
- **Vercel env vars set:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, RESEND_FROM_EMAIL, ADMIN_EMAIL
- **NOT done:** WP vendor migration (104 vendors), Resend API key, Stripe, PayPal, DNS cutover, and everything in Phases 4 through 8 below (including 6B/6C/6D).
- **Domain:** weddinglivestreaming.com — at **GoDaddy** (registrar + DNS), logged in via Chrome. Old WordPress site still serves it.
- **Old site (scrape source):** the current live https://weddinglivestreaming.com (WordPress + HivePress). Migration script: `scripts/migrate-wp.ts` (`npm run migrate:wp`).

---

## 1. PHASE 1 — Recon & baseline (est. 15 min)

1. **If `PROGRESS.md` exists, read it FIRST — you are resuming a prior run.** Then read `PLAN.md`,
   `README.md`, `SETUP.md`, `.credentials.local.md`, `package.json`, and skim `src/app` routes.
2. Verify: `git status` clean? Remote reachable? Production deploy healthy (fetch https://weddinglivestreaming.vercel.app — expect 200 + homepage renders)?
3. Via Chrome: open Vercel project → confirm env vars present; open Supabase project → confirm tables exist and count rows in `listings` and `categories`; open GoDaddy → confirm weddinglivestreaming.com is in the account and note current DNS records (record them in LAUNCH-REPORT.md for rollback).
4. Also capture from the OLD live site (https://weddinglivestreaming.com): the full sitemap/URL inventory (fetch `/sitemap.xml` and any sub-sitemaps). Save as `migration/old-site-urls.txt`. This is your 301-redirect parity source of truth.
5. Create `LAUNCH-REPORT.md` with a "State found" section.

**Acceptance:** all of the above recorded; any deviation from the snapshot noted and the plan below mentally adjusted.

## 2. PHASE 2 — Vendor migration (the site is worthless empty) (est. 30–60 min)

1. Ensure local env: copy needed keys from `.credentials.local.md` into `.env.local` (create if missing; verify gitignored).
2. `npm install`, then run `npm run migrate:wp`. The script scrapes the old WordPress site and inserts vendors/listings/photos into Supabase.
3. **Verify loop:** query Supabase — expect ≥100 approved listings with state, city, category, and hero image. Spot-check 5 random listings on the deployed site (`/listing/[slug]`) render with photo + map. Check `/directory` shows pagination and correct counts. Check 3 state pages (`/wedding-live-streaming-florida` etc.) list correct vendors.
4. If the scraper breaks on the old site's markup, fix `scripts/migrate-wp.ts` and re-run (it should upsert by slug — make it idempotent if it isn't).
5. Photos: ensure images are re-hosted into the Supabase `listings` bucket (not hotlinked to WordPress, which dies at cutover). If script hotlinks, add a download-and-reupload pass.

6. **Backup insurance:** after migration verifies, export a full data snapshot (Supabase SQL Editor
   or pg_dump via connection string) to `migration/backup-post-migration.sql` locally (gitignore it if
   it contains PII — it does: emails). Free-tier Supabase has minimal backup history; this file is the
   disaster-recovery copy. Note its location in LAUNCH-REPORT.md.
7. **Vendor claim path:** verify the claim-listing flow end-to-end — migrated vendors have no
   passwords, so claiming + password reset via email IS their onboarding. Test: claim a listing with a
   test account, confirm the admin sees the claim request and approving it links vendor→listing.
8. **Vendor contact emails — check early, it gates G3.** The public site may not expose vendor email
   addresses (HivePress often hides them behind forms). If the scraper can't capture emails, the
   announcement campaign has no recipients. Check whether Joe's WordPress admin is logged in in Chrome
   (wp-admin → Users → export); if not accessible, add "Export vendor emails from WordPress admin
   (Users → CSV)" to Joe's action list NOW and note in PROGRESS.md — don't discover this at Phase 8.

**Acceptance:** ≥100 listings live on the Vercel deploy with local photos; zero listings pointing at wordpress-hosted images; backup snapshot saved; claim flow works.

## 3. PHASE 3 — Transactional email (Resend) (est. 20 min)

1. Via Chrome, open the Resend dashboard (Joe has an account and is logged in; if the session expired this is Hard Gate G1). Create API key → add `RESEND_API_KEY` to Vercel env (all environments) and `.credentials.local.md`.
2. Add sending domain `weddinglivestreaming.com` in Resend → it gives DKIM/SPF records → **add them in GoDaddy DNS via Chrome** (this is safe pre-cutover; it doesn't move the website). Verify domain in Resend. Also add a DMARC record (`_dmarc` TXT: `v=DMARC1; p=none; rua=mailto:joe@floridasoundman.com`) — inboxes increasingly require it and it protects the domain from spoofing.
3. Redeploy. **Verify loop:** trigger the contact form / message-vendor flow on the live deploy; confirm email arrives at joe@floridasoundman.com (check via a test message to the admin address; you cannot read Joe's inbox — so instead verify via Resend dashboard "Delivered" log).

**Acceptance:** Resend dashboard shows a delivered test email; no email errors in Vercel runtime logs.

## 4. PHASE 4 — Payments (est. 45 min, has fallbacks)

**Stripe:** Joe IS logged into Stripe in Chrome, but **no business/account exists yet for
weddinglivestreaming.com** — create it:
1. In the Stripe dashboard, use the account switcher (top-left) → **"Create new account"** → name it
   `WeddingLiveStreaming` (business name: WeddingLiveStreaming.com, website: https://weddinglivestreaming.com,
   industry: marketplaces/other services). Do NOT fill in bank/tax/identity details — that's Joe's
   (see below).
2. In the new account (test mode is fine and fully functional pre-activation): create products
   Featured $29/mo and $199/yr, copy the price IDs, generate API keys, set all 5 Stripe env vars in
   Vercel + `.credentials.local.md`, configure webhook to
   `https://weddinglivestreaming.vercel.app/api/webhooks/stripe` (update to apex domain after cutover).
3. **Verify loop:** complete a test-mode checkout end-to-end with card 4242 4242 4242 4242 and confirm
   the webhook flips the listing to Featured. Then cancel that test subscription and confirm the
   webhook **downgrades the listing back to Basic** — the full lifecycle (activate, cancel, failed
   payment if simulable) must work, or vendors keep Featured forever after they stop paying.
4. **Activation = Joe's action list, not a blocker.** Going live for real charges requires bank account,
   EIN/SSN, and identity verification — personal data you must never enter (Hard Gate G5). Ship in test
   mode, put "Activate Stripe account (~10 min: bank + ID)" at the top of Joe's action list in
   LAUNCH-REPORT.md, and keep the live upgrade UI showing Stripe only once live keys exist (env flag
   `NEXT_PUBLIC_STRIPE_ENABLED` if needed).
- If the Stripe session turns out to be logged out: G1, or fall back to PayPal-only launch and log it.

**PayPal:** same pattern. Check for a PayPal developer session in Chrome; create REST app + two subscription plans ($29/mo, $199/yr), set the 5 PayPal env vars, configure webhook, verify in sandbox. If unavailable, flag-off and log.

**If BOTH unavailable:** launch anyway. The Featured tier upgrade page shows "Contact us to upgrade" (mailto). Directory revenue starts with traffic, not payment rails — do not let payments block SEO launch. Log prominently.

**Acceptance:** either a completed test-mode subscription for each enabled processor, or the processor cleanly hidden with no broken buttons.

## 5. PHASE 5 — SEO hardening + AEO layer (the edge) (est. 60–90 min)

This is what makes the site win. Current SEO baseline exists (URL parity, state pages). Add:

### 5a. Redirect & crawl parity
1. Diff `migration/old-site-urls.txt` against the new app's routes. Every old URL must either exist or 301 to its successor in `next.config.mjs` redirects. No 404s from the old sitemap. Account for trailing-slash variants (WordPress URLs end in `/`; confirm Next.js 308s them rather than 404ing).
1b. Canonical tags on every page (self-referencing, apex domain, no query params); `www` must permanently redirect to apex (Vercel does this when both domains are added — verify after cutover).
2. Generate `sitemap.xml` dynamically (listings, vendors, states, cities, categories, static pages, guides) and `robots.txt` that **explicitly allows** `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `Bingbot`. AI crawlers are customers now.

### 5b. Structured data (every page type)
- Listings: `LocalBusiness` (+ `areaServed`, `priceRange`) wrapped in `Service`; `BreadcrumbList` everywhere.
- Directory/state/city pages: `ItemList` of listings + `FAQPage` (see 5d).
- Homepage: `Organization` + `WebSite` with `SearchAction`.
- Guides: `Article` + `FAQPage`/`HowTo` as appropriate.
- Validate 1 page per type with Google's Rich Results test (via Chrome) or schema.org validator.

### 5c. llms.txt
Create `/llms.txt` (and route it): a markdown index of the site's most important pages —
what the directory is, top state pages, pricing guide, how-it-works, for-vendors — each with a one-line
description. This is the sitemap for answer engines.

### 5d. Answer-first content (AEO money pages) — create these as real routes with full content:
1. `/guides/wedding-live-streaming-cost` — THE money query. Open with a 40–60 word direct answer
   (professional: $400–$3,000 typical, DIY: $0–$150), then a full breakdown table, factors, regional
   variation, DIY-vs-pro comparison. FAQPage schema.
2. `/guides/how-to-live-stream-a-wedding` — HowTo schema, DIY walk-through that honestly says when
   to hire a pro (and links the directory).
3. `/guides/diy-vs-professional-wedding-livestream` — comparison table vs Lovecast/EventLive-style
   apps. Honest. Converts the "maybe DIY" couple into a directory user; later becomes an affiliate page.
4. `/guides/questions-to-ask-your-wedding-livestreamer` — checklist content, downloads well, gets cited.
5. Every **state page** gets: a 40–60 word "hiring a wedding livestreamer in {State}" direct-answer
   intro, vendor count, typical price range, and 3–5 state-specific FAQs with FAQPage schema.
   Generate from a template + data; do not leave thin pages.
6. Homepage and category pages: add a bolded one-sentence answer under each H2.

### 5e. Programmatic city pages
Generate `/wedding-live-streaming-[state]/[city]` for every city that has ≥1 vendor (from the DB),
same answer-first template. Add to sitemap. This is the long-tail net.

**Acceptance:** all guide routes live and indexed in sitemap; schema validates; llms.txt serves;
robots allows AI bots; zero 404s from old-site URL list; every state page has unique intro + FAQs.

## 6. PHASE 6 — Monetization expansion (beyond the $29 tier) (est. 45 min)

Build now, monetize when traffic arrives:

1. **"Get Free Quotes" lead flow (the future #1 revenue line).** On every listing, state, and city page:
   a form (date, venue city/state, guest count, budget, email) → stored in a new `leads` table →
   auto-emailed (Resend) to up to 3 matching vendors (Featured vendors get first/instant access;
   Basic vendors get the lead 24h later — that delay is the upgrade pitch). Log every lead. When volume
   justifies it, this becomes $20–50/lead or a "Pro" tier perk. Ship the mechanics now, free during beta.
2. **Featured tier value bump:** Featured = instant leads + top placement + gold badge + homepage
   carousel + "Verified" application. Update /pricing and /for-vendors copy to sell the lead advantage.
3. **Couple-side email capture:** "Free Wedding Livestream Planning Checklist" (write it as `/guides/`
   content + a simple email-gated PDF or just ungated with an email opt-in box → `subscribers` table).
   This is the future newsletter/remarketing asset.
4. **Affiliate placeholders:** on the DIY guide pages, mark the DIY-app mentions with a
   `data-affiliate-slot` so links can be swapped to affiliate URLs later (EventLive, Lovecast et al.
   have programs — applying for them is in Joe's action list, needs a human identity).
5. **Tier & expiry integrity (revenue correctness):** `featured_until` and `expires_at` must be
   enforced **at query time** (WHERE clauses in every listing query — no cron dependency): expired
   Featured listings render and sort as Basic; listings past `expires_at` drop from public pages but
   stay visible in the vendor dashboard with a "Renew" prompt. Test by backdating a test listing's
   dates in the DB and confirming public behavior changes.

**Acceptance:** lead form works end-to-end on live deploy (test lead visible in DB + Resend shows
vendor notification delivered); pricing page reflects new Featured value; subscriber capture works.

## 6B. PHASE 6B — Joe's admin command center (est. 45 min)

The codebase already has `/admin` + `/admin/listings` (approve/reject). Joe is non-technical — this
must become his single control panel so he never needs a database console. Build/extend `/admin` to
include (role=admin gated, mobile-friendly):

1. **Dashboard home:** counts + 30-day trends (listings by status/tier, new leads, new messages,
   subscribers, page-view totals if available from Vercel Analytics API — skip gracefully if not).
2. **Listings:** approve/reject/edit any listing, toggle tier manually (comp a vendor), search/filter.
3. **Leads:** table of all quote requests with status (new/sent/converted), which vendors received it,
   CSV export.
4. **Messages & reports:** view couple→vendor messages, handle reported listings, claim requests.
5. **Subscribers:** email-capture list with CSV export.
6. **Categories:** add/rename/reorder.
7. **A "Send announcement" stub** for the vendor migration email — renders the draft from
   `migration/vendor-announcement.md` with a SEND button that is disabled + labeled "Ask Claude to
   enable after your approval" (Hard Gate G3 stays intact).

**Acceptance:** log in as joe@floridasoundman.com on the live deploy → every panel above loads real
data and every action verifiably works (approve a test listing, export a CSV, edit a category).
A non-admin user hitting /admin gets redirected. Include a 2-minute "How to use your admin panel"
section in LAUNCH-REPORT.md written for a non-technical owner.

## 6C. PHASE 6C — World-class quality bar (est. 60–90 min)

Run this AFTER all features exist, BEFORE cutover. Every item gets a verify loop:

1. **Performance:** run PageSpeed Insights (via Chrome) on homepage, one listing, one state page, the
   directory. Target ≥90 Performance / ≥95 SEO / ≥95 Best Practices / ≥90 Accessibility (mobile).
   Fix images (`next/image` everywhere, proper sizes), fonts (self-host/`next/font`), and any blocking
   scripts until targets pass.
2. **Social cards:** OpenGraph + Twitter meta on every page type; **dynamic OG images** for listings
   and state pages (`@vercel/og` — vendor name/city over brand template). Validate with an OG preview
   tool.
3. **Brand hygiene:** favicon + apple-touch icons + `site.webmanifest`; custom branded 404 and error
   pages (404 should suggest the directory + nearest state pages).
3b. **Legal completeness:** add a `/terms` (Terms of Service) page — the site now takes payments,
   stores couples' contact data, and brokers leads; privacy-policy alone isn't enough. Plain-English
   template covering: directory role (not a party to vendor contracts), listing rules, Featured
   billing/cancellation, lead-data usage, liability limits. Link it in the footer + at signup and
   checkout. Flag in LAUNCH-REPORT.md that Joe may want a lawyer's once-over (not a launch blocker).
4. **Trust & safety:** honeypot + basic rate limiting on all public forms (contact, lead, register);
   security headers in `next.config.mjs` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
   sensible Permissions-Policy); confirm no service-role key ever reaches the client bundle.
5. **Accessibility pass:** alt text on all images (vendor name fallback), visible focus states, form
   labels, color contrast on brand colors, skip-to-content link.
6. **Analytics:** Vercel Analytics enabled + GA4 property created (via Chrome, Joe's Google login) with
   events: lead_submitted, message_sent, upgrade_clicked, subscriber_joined. If Google login is
   unavailable, ship Vercel Analytics only and add GA4 to Joe's action list.
7. **Cross-device sanity:** render homepage, directory, a listing, submit-listing wizard, and admin at
   375px, 768px, 1440px widths (browser devtools) — no overflow, no broken layouts.
8. **Email polish:** all Resend transactional emails use a branded HTML template (logo, brand color,
   footer with unsubscribe where legally needed).

**Acceptance:** PSI scores recorded in LAUNCH-REPORT.md meeting targets; OG images render; forms
reject bot submissions; a11y spot-checks pass; analytics events fire (verify in GA4 DebugView or
Vercel Analytics).

## 6D. PHASE 6D — Security audit (est. 60 min, do not skip any item)

Supabase's model means the browser talks to the database directly — Row Level Security (RLS) IS the
security boundary. Audit it adversarially, not by reading the policies but by **attacking them**:

1. **RLS attack test.** Using ONLY the anon key (curl/node script, no auth): attempt to (a) read
   pending/rejected listings, (b) read the `messages`, `leads`, `subscribers`, `claim_requests`,
   `reports`, and `profiles` tables, (c) INSERT/UPDATE/DELETE into every table. Then repeat as a
   logged-in NON-admin test user: try to edit another vendor's listing, read another user's messages
   and leads, set your own `role='admin'`, set your own listing `tier='featured'`. **Every one of
   these must fail.** Fix policies until they do, and save the attack script as
   `scripts/security-audit.ts` so it can be re-run after any schema change.
2. **API route authorization.** Every `/api/admin/*` route must verify role=admin **server-side**
   (not just hidden UI). Every mutating route must verify ownership (vendor edits own listing only).
   Test each with a non-admin session token.
3. **Webhook forgery.** Stripe webhook must verify the signature with `STRIPE_WEBHOOK_SECRET` and
   PayPal must verify via PayPal's verification API. Test: POST a forged "subscription active" event
   to both endpoints — must be rejected, and a listing must NOT flip to Featured.
4. **XSS via vendor content.** Vendors submit descriptions — render them as plain text or sanitized
   HTML only. Test: save a listing description containing `<script>` and `<img onerror>` payloads,
   view the page, confirm nothing executes. Same for message bodies and lead notes shown in admin.
5. **Storage bucket lockdown.** `listings` bucket: public READ is intended, but writes must require
   auth and be scoped (policy: authenticated users write only under their own folder; size + MIME
   type limits — images only, ≤5 MB). Test an anonymous upload attempt — must fail.
6. **Input validation.** Zod (or equivalent) schemas on every API route input; server-side geocoding
   inputs bounded; email fields validated; reject oversized payloads.
7. **Auth hardening (Supabase dashboard via Chrome):** email confirmation ON, leaked-password
   protection ON, auth rate limits at defaults or stricter, redirect-URL allowlist contains ONLY the
   production + vercel.app URLs (prevents open-redirect via the auth callback).
8. **Secrets sweep.** `git log -p | grep`-style scan of full repo history for keys (the temporary
   GitHub PAT, Supabase keys, anything `eyJ`/`sk_`/`re_`-prefixed). Confirm `.credentials.local.md`,
   `.env.local`, and the migration backup are gitignored. If ANY secret ever hit a commit — even in a
   private repo — rotate it (new key in provider dashboard → update Vercel env → redeploy).
9. **Dependency audit.** `npm audit` — fix criticals/highs (patch bumps only; don't destabilize).
10. **Joe's account security (action list, not agent-executable):** enable 2FA/MFA on GoDaddy,
    Vercel, Supabase, Stripe, GitHub, and Resend; use a password manager. The domain registrar is
    the crown jewel — a hijacked GoDaddy login = the whole business.

**Acceptance:** attack script passes 100% (all unauthorized attempts rejected); forged webhooks
rejected; XSS payloads inert; anonymous upload fails; no secrets in git history (or rotated);
`npm audit` shows no critical/high. Record all results in LAUNCH-REPORT.md under "Security audit".

## 7. PHASE 7 — DNS cutover at GoDaddy (est. 20 min + propagation)

**Pre-flight checklist — ALL must pass before touching DNS:**
- [ ] ≥100 listings with local images
- [ ] Old-sitemap 301 parity confirmed (test 10 sampled old URLs against the vercel.app deploy with Host rewrite or after cutover — sample now via path-equivalence)
- [ ] Contact/message flow delivers email
- [ ] No runtime errors in Vercel logs in the last hour of testing
- [ ] Phase 6B (admin panel), 6C (quality bar), and 6D (security audit) acceptance criteria passed
- [ ] LAUNCH-REPORT.md up to date
- [ ] **Old-site archive taken:** save the rendered HTML of the old site's key pages (home, 3 listings,
      2 state pages, all static pages) to `migration/old-site-archive/` — after cutover the old site is
      unreachable at the domain, and this archive is the only reference for anything missed.

Then:
1. In Vercel (Chrome or MCP): add domains `weddinglivestreaming.com` + `www`.
2. In GoDaddy DNS (keep GoDaddy nameservers): record existing A/CNAME values in LAUNCH-REPORT.md
   (rollback), then set apex A → `76.76.21.21` and `www` CNAME → `cname.vercel-dns.com`. Delete any
   conflicting old A/CNAME/forwarding records for apex and www (GoDaddy "Domain Forwarding" must be OFF).
3. Update `NEXT_PUBLIC_SITE_URL` to `https://weddinglivestreaming.com`, update Stripe/PayPal/Resend
   webhook + domain references, redeploy.
4. **Verify loop:** poll https://weddinglivestreaming.com until it serves the new site with valid SSL
   (may take minutes to a few hours). Then re-test: 5 listings, 2 state pages, sitemap, robots, llms.txt,
   a lead submission, sign-in page.
5. Rollback plan (write it in the report): restore the recorded old DNS records; old WordPress host is
   untouched.

**Acceptance:** apex + www serve the new site over HTTPS; post-cutover smoke tests pass.

## 8. PHASE 8 — Search engines & final report (est. 30 min)

1. **Google Search Console:** via Chrome, add/verify property (DNS TXT record via GoDaddy is cleanest),
   submit sitemap.xml. If a GSC property already exists from the old site, keep it — just submit the
   new sitemap. **Bing Webmaster Tools** too (imports from GSC — and Bing feeds ChatGPT search).
2. Revoke the temporary GitHub PAT ("WLS deploy (temporary)") at github.com/settings/tokens via Chrome
   — if 2FA blocks you, add to Joe's action list.
3. Re-enable TypeScript/ESLint build checks if the codebase passes (`npx tsc --noEmit`); if >20 errors,
   leave ignored and log as tech debt.
4. **Growth kit (draft, don't send):** save to `migration/` — (a) the vendor announcement email
   (G3), (b) a "you're listed — claim your free profile" cold-outreach template for NEW vendors found
   later, (c) a post-inquiry follow-up template asking couples how it went (future reviews pipeline).
   These make Joe's first month of growth copy-paste simple.
5. Write final `LAUNCH-REPORT.md`:
   - What's live (URLs, features)
   - Every credential created and where it's stored
   - **Joe's action list** (only true human-required items: e.g., Stripe activation, affiliate program
     applications, vendor announcement approval, lawyer once-over of /terms, and — after 2–4 stable
     weeks — **cancel the old WordPress hosting plan**, which becomes pure savings)
   - Revenue roadmap: current (Featured tier) → 90 days (lead fees once >50 leads/mo) → later
     (affiliate, newsletter sponsorship, city-page ads)
   - Recommended next milestone (reviews system with aggregateRating schema — biggest remaining
     SEO/AEO lever — plus vendor announcement email to migrate 104 vendor logins)
6. Update the memory files if you have memory access; otherwise the report is the handoff.

## 9. HARD GATES — the ONLY reasons to stop and ask Joe

- **G1:** A required dashboard (Supabase/Vercel/GoDaddy/Stripe/PayPal/Resend/Google) is logged out or
  hits 2FA/SMS. Ask Joe to log in / approve, then continue.
- **G2:** Any action that would incur a charge (upgrade prompts, paid tiers, domain fees).
- **G3:** Sending bulk email to the 104 existing vendors (announcement/password-reset campaign) —
  draft it, save as `migration/vendor-announcement.md`, but DO NOT SEND without Joe's OK.
- **G4:** Anything destructive to the OLD site or its data.
- **G5:** Entering personal/financial identity data anywhere (bank accounts, SSN/EIN, ID verification —
  e.g., Stripe or PayPal account activation). Set everything up around it; Joe does that step himself.
- DNS cutover is **NOT** a gate — execute it once the Phase 7 pre-flight passes.

## 10. COMPETITIVE CONTEXT (for copy and positioning decisions)

- No national directory owns this niche. Competitors: single-city service cos (LoveStream, Married
  Livestream, Wedfuly ~$1,200), DIY apps (Lovecast 20k+ couples, EventLive), generic directories
  (Wezoree, The Knot) where livestream is a buried filter. **Positioning: "The only nationwide
  directory of wedding live streaming professionals."** Exact-match domain + 104 vendors + 40 states
  is the moat; programmatic local pages + AEO answers are the growth engine.
- Price anchors for content: DIY $0–150; pro $400–$3,000; Wedfuly-style virtual coordination ~$1,200.
- Voice: warm, plain-English, couple-first; "Every love story deserves every guest" stays.
