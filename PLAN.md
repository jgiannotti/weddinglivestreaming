# WeddingLiveStreaming.com — Rebuild Plan

**Prepared for:** Joe (Owner)
**Prepared by:** Claude (Dev Team Lead)
**Date:** 2026-05-23
**Status:** Awaiting approval — Milestone 1

---

## 1. The brief

Replace the WordPress + HivePress site with a custom-built Next.js application deployed on Vercel. Match (and exceed) every HivePress feature you currently rely on — without the WordPress drag on design, performance, or maintenance.

Constraints:
- 100% free tools and services (you only pay payment processor fees that get passed to vendors)
- Preserve SEO — same URL structure, redirects where needed
- Migrate all 104+ existing vendor listings, photos, content pages
- Domain stays the same (weddinglivestreaming.com)

---

## 2. Feature parity audit

Mapped from your current site:

**Public side**
- Homepage with hero search, category filter, featured vendors carousel, browse-by-state
- Directory page with pagination, sort by date/title, category filter, location filter, geolocation ("Locate Me")
- Individual listing pages with photo, description, location/map, website link, message vendor, claim listing, report listing, related listings
- Vendor profile pages (`/vendor/[slug]/`)
- State landing pages (`/wedding-live-streaming-[state]/`) — SEO money pages
- City filter pages (`/listings/?location=Tampa`)
- Static content: How It Works, For Vendors, Pricing, About, Contact, FAQ, Privacy
- Sign in / Register / Password reset
- Add to favorites

**Vendor side**
- Submit listing wizard
- Vendor dashboard (edit listing, view inquiries, upgrade plan)
- Two pricing tiers: Basic (free, 12 months) and Featured ($29/mo or $199/yr)
- Featured benefits: top of search results, gold badge, homepage spotlight

**Admin side**
- Approve/reject listings
- Edit any listing
- Manage categories
- View users, messages, reports

**Things we're improving vs. current site**
- Real responsive design that looks intentional
- Fast page loads (Next.js static + ISR vs. WordPress queries)
- Working contact form (currently buttons just open a login modal — confusing UX)
- Map view of listings (HivePress geocodes but doesn't show a real map)
- Cleaner vendor dashboard
- Better submit-listing wizard with image preview, geocoding, validation

---

## 3. Tech stack (all free tier)

| Layer | Tool | Free tier | Why |
|---|---|---|---|
| Framework | Next.js 15 (App Router) | n/a | One codebase, server + client, best DX, SEO-friendly |
| Hosting | Vercel Hobby | Unlimited bandwidth, 100 GB-hrs functions | Built for Next.js, instant deploys, free SSL |
| Database | Supabase (Postgres) | 500 MB DB, unlimited API requests | Postgres + auth + storage in one |
| Auth | Supabase Auth | 50K monthly active users | Email/password, magic link, password reset built-in |
| File storage | Supabase Storage | 1 GB | Vendor logos, gallery photos |
| Email | Resend | 3K emails/mo, 100/day | Transactional: contact form, password reset, vendor notifications |
| Payments | Stripe | 2.9% + 30¢ per transaction | Only paid component — passed to vendor as cost of Featured tier |
| Maps | Leaflet + OpenStreetMap | Free, no API key | Real map on listing pages, no Google Maps fees |
| Analytics | Vercel Analytics + GA4 | Free | Both for redundancy |
| Search | Postgres full-text | Built into Supabase | Plenty for 100s–1000s of listings |
| Styling | Tailwind CSS + shadcn/ui | Free | Fastest path to a polished look |

**Total monthly cost:** $0 in software fees. Stripe takes 2.9% + 30¢ of Featured-tier payments only when a vendor actually pays.

---

## 4. Data model

```
users
  id, email, password_hash (managed by Supabase), display_name, avatar_url,
  role (couple | vendor | admin), created_at

vendors
  id, user_id → users, business_name, slug, bio, website_url,
  phone, member_since

listings
  id, vendor_id → vendors, title, slug, description, hero_image_url,
  city, state, country, lat, lng,
  status (pending | approved | rejected),
  tier (basic | featured),
  featured_until (timestamp, null for basic),
  view_count, inquiry_count,
  created_at, updated_at, expires_at (12 months from approval)

listing_categories  (many-to-many)
  listing_id, category_id

categories
  id, name, slug, sort_order
  (seeded: Budget-Friendly, Church & Religious, Destination, Full-Service, Multi-Camera, Solo Operator)

listing_photos
  id, listing_id, url, sort_order

messages
  id, from_user_id, to_vendor_id, listing_id, subject, body,
  read_at, created_at

favorites
  user_id, listing_id, created_at

claim_requests
  id, listing_id, user_id, details, status, created_at

reports
  id, listing_id, reporter_user_id, reason, details, status, created_at

subscriptions  (Stripe-backed)
  id, vendor_id, stripe_customer_id, stripe_subscription_id,
  plan (monthly | annual), status, current_period_end

state_pages
  slug, state_name, intro_html, cities (jsonb array)
```

---

## 5. URL structure (preserving SEO)

| Path | Purpose | Notes |
|---|---|---|
| `/` | Homepage | Hero, search, featured, browse states |
| `/directory` | All listings, paginated | Filters: category, location, sort |
| `/directory/page/[n]` | Pagination | Keep WP URL shape |
| `/listing/[slug]` | Individual listing | Same URLs — zero SEO loss |
| `/vendor/[slug]` | Vendor profile | Same as current |
| `/wedding-live-streaming-[state]` | SEO state pages | All 50 states |
| `/listings?location=...&category=...` | Filtered listings | Same query params |
| `/submit-listing` | Add listing wizard | |
| `/dashboard` | Vendor dashboard | New, replaces HivePress account UI |
| `/admin` | Admin panel | Role-gated |
| `/how-it-works`, `/for-vendors`, `/pricing`, `/about`, `/contact`, `/faq`, `/privacy-policy` | Static pages | Same URLs |
| `/auth/sign-in`, `/auth/register`, `/auth/reset` | Real auth pages | Replaces ugly modal |
| `/api/*` | Internal API routes | Stripe webhook, contact form, etc. |

301 redirects from any WP-specific URLs that don't map cleanly.

---

## 6. Migration approach

1. Scrape all 13 directory pages from your current site (already have URL structure mapped)
2. For each listing slug, fetch the full listing page
3. Parse: title, description, image URL, location, lat/lng, website, vendor name/slug
4. Download all hero images, re-upload to Supabase Storage with same filename
5. Create vendor records (one per unique vendor slug)
6. Create listing records (status = approved, tier = basic, expires_at = +12 months from original "Added on" date)
7. Backfill state pages from existing intro text
8. Vendors keep their original "Added on" date displayed

**Vendor passwords:** WordPress hashes aren't portable. Plan: at launch, send all existing vendors a one-time email "Your listing has moved — set a new password" link. Their listings stay live regardless of whether they log in.

---

## 7. Build order & milestones

**Phase 1 — Foundation (Week 1, days 1–3)**
- Next.js scaffold, Tailwind, shadcn/ui, design tokens (matches your current brand)
- Supabase project, schema migrations, seed categories
- Public layout: header, footer, nav

**Phase 2 — Public marketplace (Week 1, days 4–7)**
- Homepage with hero/search/featured/states
- Directory page with filters, sort, pagination
- Listing detail page with map, contact button
- State landing pages (auto-generated for all 50 states)
- All static content pages

**Phase 3 — Auth + vendor side (Week 2, days 1–4)**
- Sign in / register / password reset (real pages, no ugly modal)
- Submit listing wizard with image upload + geocoding
- Vendor dashboard: my listings, edit, inquiries, plan

**Phase 4 — Payments + admin (Week 2, days 5–7)**
- Stripe Checkout, subscription webhooks, featured-listing logic in queries
- Pricing page with live Checkout buttons
- Admin panel: approve/edit listings, manage categories

**🚩 Milestone 2 check-in** — show you the staging site to review design + flows

**Phase 5 — Migration + SEO (Week 3, days 1–4)**
- Scrape WordPress, import everything into Supabase
- Sitemap, structured data, meta tags
- 301 redirect map

**Phase 6 — Launch (Week 3, days 5–7)**
- Final QA against checklist
- Deploy to Vercel production
- DNS cutover from current host → Vercel

**🚩 Milestone 3 check-in** — final approval before DNS swap

---

## 8. What I need from you

To approve and start building, I need confirmation on these:

1. **Tech stack OK?** Next.js + Vercel + Supabase + Stripe + Resend (all free tier).
2. **Pricing stays at $29/mo or $199/yr?** Or want to change tiers/prices?
3. **Email for vendor notifications.** What address should "noreply@" come from? (I'll set up Resend with `noreply@weddinglivestreaming.com`.)
4. **Stripe account.** Do you have one? If not, I'll walk you through setup — takes 5 min.
5. **Domain currently with what registrar?** I'll need to know to plan the DNS swap.
6. **Anything you want to add or change** from the current HivePress feature set?

Once you green-light, I start building immediately. Next time you hear from me will be at Milestone 2 with a working staging site to click through.
