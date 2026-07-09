# MILESTONE-2-LOCATION.md — Location Intelligence & Search UX

> **Kickoff (Joe):** fresh chat, this folder + Chrome connected, paste:
> **"Read MILESTONE-2-LOCATION.md in the project folder and execute it fully. Do not stop unless you hit a Hard Gate."**

**Agent:** all operating rules, Hard Gates, and continuity practices from `EXECUTE-ONESHOT.md` §0 and §9
apply verbatim (PROGRESS.md checkpoints, verify-loops, free tier only, secrets discipline, subagents for
bulk work). Read `LAUNCH-REPORT.md` and `PROGRESS.md` first. Append results to LAUNCH-REPORT.md.

## The problem (verified in code)

- `src/lib/data/listings.ts` filters by `ilike` on city/state strings — a St. Petersburg vendor never
  appears in a Tampa search. This silently kills conversions and lead volume.
- `listings.lat/lng` + an `ll_to_earth` index exist in migration 0001 but are unused and possibly unpopulated.
- No vendor coverage radius concept at all.
- Search box (`src/components/search-bar.tsx`) is a bare text input — no autocomplete, no suggestions.

**New resource:** Joe has a **Mapbox account logged in in Chrome**. Get the default public token
(account.mapbox.com → Tokens) → `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel + `.credentials.local.md`.

**Mapbox usage decision (ToS-aware, final):** Mapbox's free Temporary Geocoding API prohibits
permanently storing results. So: **stored coordinates come from a bundled public-domain US
cities/ZIP dataset** (no API, no ToS issue, instant), and **Mapbox is used where it shines** —
live autocomplete UX (Search Box / Geocoding API, session-based, free tier ~100k/mo) and optionally
prettier map tiles (Mapbox GL free 50k loads/mo; current Leaflet+OSM works, upgrade only if styling
time permits). If any Mapbox usage would exceed free tier, don't — G2.

## Phase A — Ground truth (est. 15 min)
1. Query Supabase: how many approved listings have non-null lat/lng? What distinct city/state values
   exist (typos? "St Pete" vs "Saint Petersburg"?). Record in PROGRESS.md.
2. Confirm `earthdistance`/`cube` extensions are enabled (migration 0001 implies yes — verify).

## Phase B — Cities backbone (est. 45 min)
1. New migration: `cities` table (name, state_code, lat, lng, population, slug) seeded from a
   public-domain/free-license US cities dataset (e.g., SimpleMaps US Cities basic — verify license
   allows DB use with attribution; else use Census/GeoNames). Include all cities >1k population
   (~30k rows — trivial for Postgres). Public read-only RLS.
2. Optional but cheap: `zips` table (zip → lat/lng, city, state) from the free Census/GeoNames ZIP
   dataset — enables "33701" searches.
3. Normalize listing locations: match every listing's city+state to a `cities` row (fuzzy-fix typos,
   log unmatchables for admin review); backfill `listings.lat/lng` from city centroids where null.

## Phase C — Coverage radius (est. 30 min)
1. Migration: `listings.service_radius_miles int default 60` (bound 10–500) +
   `listings.travels_nationwide boolean default false` (destination-wedding vendors are already a
   category — they should surface everywhere with lower rank).
2. Sensible defaults by category: Solo Operator 40, Budget-Friendly 40, Full-Service/Multi-Camera 100,
   Destination = nationwide flag.
3. Vendor dashboard: radius slider + nationwide toggle on the edit-listing form, with plain-English
   copy ("How far will you travel? Couples searching within this distance will find you.").
4. Admin: radius visible/editable in the listings panel.

## Phase D — Radius search (the fix) (est. 60 min)
Replace string-match location filtering with tiered geo search (Postgres function, uses the existing
`ll_to_earth` index):
1. Resolve the search input → coordinates: exact `cities`/`zips` lookup first.
2. Tier 1: listings where `distance(listing, search_point) <= service_radius_miles` (the vendor
   covers the couple) — sort: Featured first, then distance.
3. Tier 2 (if <5 results): expand to state matches beyond radius, labeled "More vendors in {State}".
4. Tier 3: `travels_nationwide` vendors, labeled "Travels to you".
5. Always-on: distance chips on listing cards ("~18 mi from Tampa"); honest empty state keeps the
   existing lead-capture form.
6. State/city SEO pages use the same function (city pages: radius from that city's centroid — a
   Clearwater page correctly shows Tampa vendors, which also fattens thin city pages).

## Phase E — Autocomplete & search UX (est. 60 min)
1. **Type-ahead:** debounced (150ms) API route querying `cities` (+`zips`) by prefix, ranked by
   population — instant, free, offline-proof. Proper ARIA combobox: keyboard nav, highlighted match,
   touch-friendly. Show "City, ST" format. This is the mainstream-site feel Joe wants.
2. **Mapbox enhancement:** if own-DB suggestions return <3 results for the input, supplement with
   Mapbox Search Box suggestions (US, place/postcode types only) — session token per keystroke series.
   Feature-flag it (`NEXT_PUBLIC_MAPBOX_TOKEN` present = on) so the site never breaks without Mapbox.
3. "Near me" button: geolocation → nearest city from own DB (replace the Nominatim reverse-geocode —
   one less third party) → radius search.
4. Rate-limit + cache the suggest endpoint (it's public); cap query length; log nothing personal.
5. Recent searches (localStorage, max 5) shown on focus. Popular cities shown when input is empty.

## Phase F — "Use it like a couple" audit (est. 45 min)
Joe suspects more gaps — find them systematically. Complete these journeys on the live site (mobile
viewport first), fixing friction as you go, logging bigger items to LAUNCH-REPORT.md:
1. Couple in a suburb: search a small town near a big metro → should find metro vendors (Phase D proof).
2. Couple with only a ZIP code.
3. Couple on a phone at work: 60 seconds to shortlist 3 vendors and send 1 lead.
4. Vendor: sign up → submit listing → set radius → understand what Featured buys.
5. Skeptical guest: land on a guide from search → trust signals (real vendors, real prices) → directory.
Fix in-scope UX issues found (loading skeletons, back-button behavior, filter persistence, tap targets,
form error messages). Anything structural goes in the report as milestone-3 candidates.

## Phase G — Verify & ship
1. `scripts/security-audit.ts` re-run (new tables/endpoints must pass: cities/zips read-only, suggest
   endpoint rate-limited, radius bounds enforced server-side).
2. PageSpeed re-check on directory + a city page (autocomplete JS must not tank mobile perf).
3. Update sitemap if city-page coverage grew; update llms.txt if guides/pages changed.
4. Append to LAUNCH-REPORT.md: what changed, before/after search behavior (with the St. Pete→Tampa
   example proven via URL), Mapbox usage + limits, audit findings, milestone-3 candidates.

**Done =** searching any US city or ZIP returns every vendor whose coverage circle includes it,
sorted Featured-then-distance, with type-ahead suggestions that feel like a mainstream site — verified
live, security re-audited, performance held.
