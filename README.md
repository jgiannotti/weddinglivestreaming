# WeddingLiveStreaming.com

The rebuilt directory for wedding live streaming vendors — Next.js + Supabase + Vercel, replacing WordPress + HivePress.

## Quick look — see the new design right now

Open **[preview/index.html](./preview/index.html)** in your browser. No setup required — it's a self-contained static HTML preview of the new homepage so you can react to the design direction before any installation.

## What's in this folder

```
weddinglivestreaming.com/
├── PLAN.md                  — full architecture & build plan (start here)
├── README.md                — this file
├── SETUP.md                 — step-by-step setup for non-developers (see below)
├── preview/index.html       — open this in any browser to see the design now
├── src/                     — Next.js app source
│   ├── app/                 — pages (homepage, directory, listing, state, pricing, …)
│   ├── components/          — UI components
│   ├── lib/                 — types, utils, US state data, categories
│   └── data/                — mock data (used until Supabase is wired up)
├── supabase/migrations/     — database schema (Postgres)
├── scripts/migrate-from-wordpress.ts — migration script for your 104 listings
├── package.json             — dependencies and run scripts
└── .env.example             — environment variables template
```

## Status

| Phase | Status |
|---|---|
| ✅ Plan approved | done |
| ✅ Project scaffolded | done |
| ✅ Design system + brand identity | done |
| ✅ Homepage, Directory, Listing detail, State pages, Pricing | done |
| ✅ Static pages (How It Works, For Vendors, About, Contact, FAQ, Privacy) | done |
| ✅ Database schema (Supabase Postgres) | done |
| ✅ WordPress migration script | done |
| ✅ Auth (sign in / register / reset) | done |
| ✅ Vendor dashboard (listings, messages, plan) | done |
| ✅ Submit-listing form with image upload + geocoding | done |
| ✅ Contact form / direct messaging with email notifications | done |
| ✅ Stripe + PayPal checkout + webhooks (both processors supported) | done |
| ✅ Admin moderation panel (approve/reject) | done |
| ✅ SEO: sitemap, robots.txt, JSON-LD structured data | done |
| ⏳ Run migration on live Supabase | when accounts created |
| ⏳ Deploy to Vercel + DNS cutover | final step (see LAUNCH-CHECKLIST.md) |

## Running it locally

You'll need Node.js 20+ installed. If you don't have it: <https://nodejs.org/> (download the LTS version).

```bash
# Install dependencies
npm install

# Copy the env template and fill in your keys (see SETUP.md)
cp .env.example .env.local

# Start the dev server
npm run dev
```

The site runs at http://localhost:3000 — currently using mock data, so it works without Supabase being configured yet.

## What's mocked right now

The app currently reads from `src/data/mock-listings.ts` (10 sample vendors pulled from your live site). This lets you click through every page and see how it feels before any database is wired up. Once Supabase is connected, swap the mock helpers for `supabase.from('listings').select(...)` calls — the data shape is identical.

## Tech stack (all free tier)

- **Next.js 15** (App Router) — frontend + backend in one codebase
- **Vercel** — hosting, free SSL, instant deploys
- **Supabase** — Postgres database + auth + file storage (1 GB free)
- **Resend** — transactional email (3K/month free)
- **Stripe + PayPal** — Featured-tier subscriptions, vendor's choice
- **Tailwind CSS + shadcn/ui** — styling
- **Leaflet + OpenStreetMap** — maps, no Google Maps fees

## Need help?

This is being built in collaborative sessions. If anything breaks, opens a new conversation and reference this folder — the agent picks up where we left off via the plan doc and project memory.
