# SEED-VENDORS.md — Vendor Discovery & Profile Seeding Loop

**Kickoff prompt (paste into a fresh Sonnet Cowork chat with this project folder selected):**

> Read SEED-VENDORS.md in the project folder and execute it top to bottom. Follow §1 operating rules exactly. Run the discovery loop in §5 continuously, checkpointing per §9, until I tell you to stop or a stop condition hits.

---

## §0 — Mission & context

WeddingLiveStreaming.com is a live Next.js/Supabase directory of wedding livestreaming vendors (currently ~104 vendors migrated from the old WordPress site). We are seeding the directory with **real, verified vendors** discovered from the open web, each with the **richest possible profile** scraped from their own website and public sources.

Endgame (NOT this chat's job, but shapes the data you collect):
1. Seeded profiles go live as "unclaimed" listings.
2. A "Claim your profile" flow (a `claim_requests` table already exists in the DB).
3. An outreach email to each vendor offering to claim their profile with a coupon for a yearly plan — so **capturing a contact email and a contact name is high-value**.

Your job in this chat: **discover → validate → scrape → structure → save locally.** Nothing goes into the production database and no one is contacted. A later milestone imports your JSON output.

## §1 — Operating rules (hard constraints)

1. **Never email, message, DM, or contact any vendor.** Data collection only.
2. **Never write to the production Supabase database or touch Stripe/PayPal/Resend.** All output is local files under `seed/` in this project folder.
3. **Do not modify anything outside `seed/`** — no changes to `src/`, config, or docs. Another chat is actively developing the website. Do not `git push` or `git commit`.
4. **Do not attempt `npm run build` / `npm run dev`** — the sandbox node_modules is known-broken. You don't need it.
5. **No fabricated data — ever.** Every field value must be traceable to a source URL you actually fetched. If a field isn't stated by the vendor or a cited source, leave it `null`. Never infer prices, ratings, years in business, or specialties. This dataset becomes public claims about real businesses; a wrong price or fake review quote is a reputational and legal problem.
6. **Copyright discipline:**
   - `description_seo` must be an **original rewrite** in your words — never copy the vendor's about/marketing text verbatim into a display field. Keep verbatim text only in `raw.about_text` (internal, never displayed).
   - Record image URLs; **do not download images**. Whether any vendor-owned imagery is displayed pre-claim is Joe's decision (§11) — the site can launch seeded profiles with category stock heroes.
   - Testimonial quotes: max 1–2 short quotes per vendor, always with source URL, marked `display: false` by default.
7. **Aggregator courtesy:** The Knot, WeddingWire, Zola, Yelp, Google Maps etc. may be used to *discover* vendor names/websites and record simple facts (a star rating + review count, with source). Do not bulk-scrape their content, copy their review text, or reproduce their editorial descriptions.
8. **Tool discipline:** Use `WebSearch` + `web_fetch` as primary tools. If a site is client-rendered (fetch returns a shell/spinner), retry once via the Claude-in-Chrome browser tools; if still unusable, record what you have and set `scrape_quality: "partial-js"`. Never fall back to curl/requests for blocked domains.
9. **Idempotent & resumable:** On start, always read `seed/tracker.json` first and resume from it. Never re-scrape a domain already in `done` or `rejected` unless its entry has `retry: true`.

## §2 — Scope: what counts as a vendor

**In scope:** A real, currently-operating business (or clearly active solo professional) in the **United States** that offers **wedding livestreaming as an advertised service** — whether livestream-only, or a videographer/production company with a named livestream offering/package/page.

**Out of scope (reject with a reason in the tracker):**
- Directories, aggregators, marketplaces, blogs, "best of" listicles (use them as discovery sources, never as vendor entries)
- Pure videographers with **no mention** of livestreaming anywhere on their site
- Software/platforms (Lovecast, EventLive, Zoom, etc.) rather than service providers — but record them in `seed/platforms-seen.md`, it's useful market intel
- Church A/V installers, corporate-only streaming companies with no wedding offering
- Defunct businesses: dead domain, parked page, no activity signal since ~2024 (copyright year, blog, socials). If uncertain, keep with `activity_confidence: "low"` rather than reject.
- Non-US vendors: don't seed, but append to `seed/international-parking-lot.csv` (name, country, URL) — possible future expansion.

**Dedup keys:** normalized root domain (primary), then fuzzy `business_name + city`. Check against (a) the existing live directory and (b) everything already in the tracker. To get the live directory list, fetch `https://www.weddinglivestreaming.com/sitemap.xml` once at session start and extract all `/listing/` and `/vendor/` slugs into `seed/existing-live-slugs.txt`; refresh it each new session.

## §3 — File layout (all under `seed/`)

```
seed/
  tracker.json                 # the loop's brain — queue, done, rejected, stats
  existing-live-slugs.txt      # slugs currently live on the site (dedup)
  vendors/<domain>.json        # one file per accepted vendor, schema in §4
  batch-reports/BATCH-NNN.md   # human report every 25 vendors (§9)
  international-parking-lot.csv
  platforms-seen.md
  QUESTIONS-FOR-JOE.md         # append-only; anything needing his call
```

`tracker.json` shape:

```json
{
  "stats": { "accepted": 0, "rejected": 0, "queries_run": 0, "last_batch": 0 },
  "query_queue": ["..."],
  "queries_done": ["..."],
  "candidate_queue": [ { "domain": "", "name_hint": "", "found_via": "" } ],
  "done": { "<domain>": { "name": "", "city": "", "state": "", "completeness": 0.0 } },
  "rejected": { "<domain>": "reason" }
}
```

Update the tracker **after every vendor**, not in batches — a crashed session must lose at most one vendor of work.

## §4 — Seed Profile Schema v1 (one JSON per vendor)

This is deliberately a **superset** of the current DB schema. Current `listings`/`vendors` tables only hold: business name, bio, website, phone, title, description, hero image, city/state, lat/lng, service radius, travels_nationwide, categories, photos. Everything else below is captured for **future profile fields** — the whole point is to learn from real vendor sites what couples would want to compare. Capture generously; a later migration will add columns/JSONB for what proves common.

Every non-null leaf value must be justified by a URL in `meta.sources`. Use `null` for unknown, never guess. Dollar amounts as integers (USD).

```json
{
  "schema_version": 1,

  "identity": {
    "business_name": "", "suggested_slug": "",
    "website": "https:// (canonical root)",
    "tagline": null, "founded_year": null, "owner_names": [], 
    "team_size_hint": null, "languages": [], "is_solo_operator": null
  },

  "location": {
    "hq_city": "", "hq_state": "", "hq_zip": null, "country": "United States",
    "lat": null, "lng": null,
    "service_area_text": null, "service_radius_miles_estimate": null,
    "travels_nationwide": null, "does_destination_weddings": null,
    "additional_locations": []
  },

  "contact": {
    "emails": [ { "address": "", "type": "general|person", "name": null, "source": "" } ],
    "phones": [], "contact_form_url": null, "booking_link": null
  },

  "social": {
    "instagram": null, "facebook": null, "youtube": null, "vimeo": null,
    "tiktok": null, "linkedin": null, "x": null,
    "instagram_followers_approx": null, "last_activity_seen": null
  },

  "services": {
    "livestream_is_core_business": null,
    "other_services": ["videography", "photography", "dj", "photo-booth", "..."],
    "camera_count_options": null,
    "platforms_streamed_to": ["Zoom", "YouTube", "Vimeo", "private page", "..."],
    "private_viewing_page": null, "backup_internet": null,
    "recording_included": null, "replay_available": null, "replay_duration": null,
    "onsite_operator": null, "remote_operated_option": null,
    "guest_interaction_features": null, "same_day_edit": null,
    "av_or_hybrid_events": null, "multilingual_streams": null,
    "religious_ceremony_experience": null, "venue_types_mentioned": [],
    "insurance_mentioned": null, "equipment_highlights": []
  },

  "pricing": {
    "starting_price": null, "price_range_low": null, "price_range_high": null,
    "packages": [ { "name": "", "price": null, "duration_hours": null, "includes": [], "source": "" } ],
    "travel_fee_notes": null, "pricing_page_public": null, "pricing_notes": null
  },

  "proof": {
    "sample_video_urls": [], "featured_wedding_urls": [],
    "testimonials": [ { "quote": "", "attribution": "", "source": "", "display": false } ],
    "ratings": [ { "platform": "google|theknot|weddingwire|yelp", "rating": null, "review_count": null, "source": "" } ],
    "awards_press": [], "years_of_weddings_claimed": null, "weddings_count_claimed": null
  },

  "content": {
    "description_seo": "150–250 word ORIGINAL rewrite, third person, factual, no superlatives you can't source",
    "one_line_summary": "",
    "faq_items": [ { "q": "", "a_summary": "" } ],
    "raw_about_text": "verbatim, INTERNAL ONLY"
  },

  "media": {
    "logo_url": null, "og_image_url": null,
    "gallery_image_urls": [], "video_embed_urls": [],
    "display_rights": "unclaimed-none"
  },

  "category_mapping": {
    "existing_categories": ["one+ of: budget-friendly | church-religious | destination-weddings | full-service-production | multi-camera-cinematic | solo-operator"],
    "suggested_new_tags": ["e.g. drone, hybrid-av, remote-only, bilingual-spanish, lgbtq-friendly (only if vendor states it)"]
  },

  "meta": {
    "discovered_via": "query or source URL",
    "scrape_date": "YYYY-MM-DD",
    "pages_fetched": [],
    "sources": [ { "url": "", "supports": "which sections" } ],
    "scrape_quality": "full | partial-js | thin",
    "activity_confidence": "high | medium | low",
    "completeness_score": 0.0,
    "field_notes": "anything odd, ambiguous, or worth a human look"
  }
}
```

**Completeness score** (drives the quality bar): +0.15 each for email, phone/contact-form, description_seo, city/state; +0.10 each for pricing anything, sample video, social link, service details (≥4 non-null service fields). Target ≥0.60 average; a vendor below 0.40 is still saved (real > complete) but flagged in the batch report.

## §5 — The discovery loop

Run this loop continuously. One full pass = one vendor accepted or rejected.

```
LOOP:
 1. If candidate_queue is non-empty → pop next candidate, go to step 4.
 2. Pop next query from query_queue (generate more per §6 if < 10 remain).
 3. WebSearch it. From results, harvest EVERY plausible vendor domain into
    candidate_queue (not just the top hit) — including vendors named inside
    listicles/directories you open. Move query to queries_done.
 4. DEDUP: normalize domain; skip if in done/rejected/existing-live-slugs.
 5. VALIDATE (cheap first): fetch homepage. Apply §2 scope test.
    Reject fast, with reason, into tracker.rejected.
 6. SCRAPE (accepted candidates): fetch up to ~8 URLs per vendor, in priority:
    home → livestream service/package page → pricing → about → contact →
    FAQ → reviews/testimonials → one blog/portfolio post if it reveals
    service details. Also: check for /sitemap.xml to find these pages fast;
    grab og:image + JSON-LD (LocalBusiness schema often has address/phone/
    ratings — high-quality structured data, cite the page as source).
 7. ENRICH (max 2 extra searches per vendor):
    - `"<business name>" <city> reviews` → grab Google rating/review count
      from the search result surface if visible (source: the SERP).
    - If no email found on-site: search `"<business name>" email OR contact`.
      Record contact_form_url as fallback — never guess an email.
 8. EXTRACT into §4 JSON. Write seed/vendors/<domain>.json.
 9. MINE the vendor's site for expansion leads (§6): venues/vendors they
    name-drop, associations, "as featured in" — add queries/candidates.
10. Update tracker.json (stats, done). Every 25 accepted → §9 checkpoint.
GOTO LOOP
```

Budget guidance: a vendor should take roughly 8–12 fetches/searches total. Depth beats speed, but don't gold-plate: two failed attempts to find a fact = record `null` and move on.

## §6 — Query generation (never run dry)

Seed the queue at first run with combinations of:

- **Term × State:** {"wedding livestream service", "wedding live streaming videographer", "stream my wedding", "wedding webcast"} × all 50 states + DC — **prioritized by**: (a) states with the fewest live listings (check existing-live-slugs.txt state pages), (b) big wedding markets: FL, CA, TX, NY, NJ, PA, IL, GA, NC, OH, AZ, CO, TN, VA, WA.
- **Term × Metro:** same terms × top ~60 metro areas ("wedding livestream Tampa", "... Nashville", "... Long Island"...).
- **Niche terms:** "church wedding livestream company", "Indian wedding live streaming USA", "bilingual wedding livestream", "multicam wedding livestream", "wedding livestream for military deployment", "funeral and wedding livestreaming" (many operators do both).
- **Directory mining:** site:theknot.com wedding livestream <state>, site:weddingwire.com..., Google Maps queries ("wedding live streaming near <city>"), local wedding-blog vendor guides, WEVA / local videographer association member lists.
- **Expansion (highest yield):** competitor/partner mentions on scraped sites, "styled shoot" credit lists, venue preferred-vendor pages found during scrapes.

Rotate categories so output isn't 100 videographers from one state. Log every exhausted query into `queries_done`.

## §7 — Extraction judgment calls

- **city/state (required):** use the vendor's stated HQ/base. Multi-city businesses: HQ as primary, others in `additional_locations`. If truly no location is stated anywhere (site, socials, schema.org), reject as unverifiable.
- **lat/lng:** only if trivially available (JSON-LD/schema markup). Otherwise null — the site geocodes from city/state later.
- **Category mapping:** map honestly to the 6 existing categories; ≥1 required. "Budget-Friendly" only if starting price ≤ ~$500 or vendor self-describes as budget/affordable.
- **description_seo voice:** third-person, warm but factual, mentions city/region, what's actually offered, and one differentiator. Written for a couple comparing vendors. No "premier", "unforgettable", "magical" unless quoting a sourced award.
- **Conflicting info** (e.g., old pricing page vs. new): prefer the page that looks current; note the conflict in `meta.field_notes`.

## §8 — What NOT to collect

No data about private individuals beyond business-contact context (owner's name + business email/phone is fine; personal home addresses, personal cell numbers labeled as personal, or anything about their family is not). No copying of couples' names/photos from galleries into our data. No review text scraped in bulk from Google/Yelp/The Knot.

## §9 — Checkpoints, reports, and stop conditions

**Every 25 accepted vendors**, write `seed/batch-reports/BATCH-NNN.md`:
- Count accepted/rejected this batch + running totals; states covered (table)
- Avg completeness; % with email (this is the claim-campaign fuel — call it out)
- 3 best profiles (name + why) and any weak ones
- New field patterns noticed — *"many vendors advertise X, we should consider an X profile field"* (this feeds Joe's future-fields goal; be specific)
- Anything appended to QUESTIONS-FOR-JOE.md

**Stop conditions** (halt and summarize): Joe says stop · 400 accepted vendors · query queue exhausted and expansion yields < 1 new vendor per 10 queries · repeated tool failures making scraping unreliable.

**Session end/restart:** the tracker makes every session resumable. On restart: re-read this file, reload tracker, refresh existing-live-slugs.txt, continue.

## §10 — Explicitly out of scope for this chat

- Importing JSON into Supabase (later milestone: add JSONB/columns, insert as `status='pending'`, `tier='basic'`, unclaimed)
- Building the claim flow UI/UX (DB table exists; product work is separate)
- The coupon + outreach email campaign (requires Resend setup + Joe's approval to send — a Hard Gate)
- Any code or design changes to the website

## §11 — Decisions parked for Joe (defaults already applied)

1. **Vendor imagery pre-claim:** default = seeded profiles show NO vendor-owned photos until claimed (copyright-safe; also a claim incentive: "claim to add your photos"). We store all image URLs so claimed profiles light up instantly. Joe can override.
2. **International vendors:** parked in a CSV, not seeded. Say the word to include Canada/UK.
3. **Volume target:** default 400 accepted vendors (≈ quadruples the directory). Raise/lower anytime.
4. **Videographers where livestream is a minor add-on:** included if the add-on is genuinely advertised, mapped honestly. If Joe wants livestream-first only, tighten §2.
