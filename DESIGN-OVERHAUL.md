# DESIGN-OVERHAUL.md — World-Class Redesign Spec for weddinglivestreaming.com

> **Kickoff prompt (paste this into a fresh Sonnet Cowork chat):**
> "Read DESIGN-OVERHAUL.md in the project folder and execute it top to bottom. Follow the spec exactly — every color, font, and class decision is already made; your job is faithful implementation plus the screenshot verify-loop in §9. Do not redesign or substitute your own taste. Commit locally when done; I'll push to GitHub myself."

**Author:** Fable (design decisions locked — executor implements, does not re-decide)
**Date:** 2026-07-09
**Direction approved by Joe:** Refined romantic, photography-led. Free stock photography (Pexels) approved.

---

## 0. Context the executor must know

1. **The marketplace is empty.** Zero listings in production (Joe's 2026-07-07 decision — old WP data unrecoverable; vendor acquisition is a future outreach project). The redesign must make the site look intentional and premium *with no vendor data*. Every empty state is a first-class design surface, not an afterthought.
2. **Do not touch:** the data layer (`src/lib/data/listings.ts`), auth, payments, API routes, RLS, canonical/metadata logic, sitemap, robots, JSON-LD. This is a presentation-layer overhaul only.
3. **Git:** the sandbox cannot push. Commit locally with clear messages; Joe runs `git push origin main` himself (Vercel auto-deploys from main).
4. **Preserve:** PSI ≥ 90 (use `next/image` for all photos, correct `sizes`, `priority` only above the fold), all existing routes and URL patterns, all copy meaning (you may tighten wording where this spec says so).
5. Stack: Next.js 15 App Router, Tailwind, shadcn-style components in `src/components/ui/`.

---

## 0.5 PRE-FLIGHT BUG FIX (do before any design work): state pages are 404 in production

**Every** `/wedding-live-streaming-{state}` URL returns 404 live (verified 2026-07-09 via curl: california, texas, florida all 404). Root cause: the route folder is `src/app/wedding-live-streaming-[state]/`, a *partial* dynamic segment (`prefix-[param]`), which Next.js App Router does not support — a segment must be entirely `[param]` to be dynamic. The page code, `generateStaticParams`, and empty-listing handling are all fine; the route simply never matches. This kills the whole per-state SEO/AEO layer and every "Popular States" link in the footer/homepage.

**Fix (preserves the exact URL shape — do not change URLs):**
1. Move `src/app/wedding-live-streaming-[state]/page.tsx` → `src/app/state/[state]/page.tsx` (keep all code, including its `generateMetadata` — canonicals already point at `/wedding-live-streaming-{slug}`, which stays correct).
2. In `next.config.mjs` add a rewrite (NOT a redirect — the public URL must stay `/wedding-live-streaming-florida`):
   ```js
   async rewrites() {
     return [{ source: '/wedding-live-streaming-:state', destination: '/state/:state' }];
   }
   ```
3. Add a `robots: { index: false }`–style guard is NOT needed, but do prevent direct crawling of the internal path: in `src/app/state/[state]/page.tsx` nothing changes (canonical already handles duplicate-URL risk).
4. Verify: `npm run build` then hit `/wedding-live-streaming-florida`, `-california`, `-texas`, and one invalid slug (expect 404) on the local/preview build. After Joe pushes, re-verify on production and confirm the sitemap URLs return 200.

Commit this alone as: `fix: state pages 404 — partial dynamic segment not supported, rewrite to /state/[state]`.

---

## 1. Design system changes (do these first)

### 1.1 Typography — replace Cormorant Garamond with Fraunces

Cormorant renders thin and weak at screen weights; it's the single biggest "template" tell. Fraunces is a contemporary editorial serif with real presence (variable optical sizing, beautiful italics) and reads luxury-2026, not 2018-wedding-blog.

In `src/app/layout.tsx`:

```tsx
import { Inter, Fraunces } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});
```

In `tailwind.config.ts`: `display: ['var(--font-fraunces)', 'Georgia', 'serif']`. Keep Inter for body/UI.

**Type rules (apply globally):**
- Display headings: `font-display font-medium tracking-tight`, letter-spacing `-0.02em` on h1/h2 (add to globals `@layer base`).
- One italic serif accent word per major headline (`<em class="italic text-primary">`), pattern already used in hero — keep and extend it.
- Body max line length ~65ch. Eyebrow labels: `text-xs font-semibold tracking-[0.18em] uppercase text-primary/80`.

### 1.2 Color tokens — deepen contrast, add an "ink" surface

Replace the `:root` block in `src/app/globals.css` with:

```css
--background: 36 45% 97%;           /* warm ivory */
--foreground: 340 30% 13%;          /* deep plum-black */
--card: 0 0% 100%;
--card-foreground: 340 30% 13%;
--primary: 345 60% 29%;             /* deep burgundy — richer than current rose */
--primary-foreground: 36 45% 97%;
--secondary: 30 25% 93%;
--secondary-foreground: 340 30% 13%;
--muted: 30 25% 95%;
--muted-foreground: 340 10% 42%;
--accent: 348 45% 93%;              /* blush */
--accent-foreground: 345 60% 25%;
--gold: 38 60% 50%;
--gold-foreground: 0 0% 100%;
--ink: 342 32% 11%;                 /* NEW: dark plum surface for footer + vendor CTA */
--ink-foreground: 36 45% 96%;
--destructive: 0 70% 50%;
--destructive-foreground: 0 0% 100%;
--border: 30 20% 87%;
--input: 30 20% 87%;
--ring: 345 60% 29%;
--radius: 0.75rem;
```

Add `ink: { DEFAULT: 'hsl(var(--ink))', foreground: 'hsl(var(--ink-foreground))' }` to `tailwind.config.ts` colors.

**Usage law:** ivory is the default page surface; `bg-ink` is used for exactly two moments per page (max) — it's the rhythm device that makes the ivory feel warm instead of flat. Gold appears ONLY on Featured-tier signals.

### 1.3 Shape & elevation

- Cards/images: `rounded-2xl`. Buttons and inputs: `rounded-full` (pill). Chips: `rounded-full`.
- Update `src/components/ui/button.tsx`: base gets `rounded-full`; `size="lg"` → `h-12 px-8 text-[15px]`; default size → `h-10 px-6`. Primary variant gets `shadow-sm hover:shadow-md hover:-translate-y-px transition-all`.
- Kill all dashed borders site-wide. Dashed borders read as "unfinished."

### 1.4 Photography system

Source: **Pexels** (free for commercial use, no attribution). Download at ~1600–2400px wide, save to `public/images/`, compress (quality ~80 via `npx sharp-cli` or similar to keep each under ~250KB). Always render through `next/image`.

Selection criteria (reject anything that misses one): warm/golden tones matching the ivory-burgundy palette · candid emotion, not posed stock smiles · no visible brand logos · diverse couples across the full set · at least two shots showing a videographer/camera rig or a laptop/phone displaying a live stream (the category is *livestreaming*, not generic weddings).

Suggested Pexels queries: `wedding videographer camera`, `wedding couple golden hour`, `bride groom candid ceremony`, `video call grandmother laptop happy`, `wedding guests emotional`, `camera gimbal wedding`.

Needed shots: `hero-a.jpg` (couple, vertical or 4:5), `hero-b.jpg` (videographer at work, 4:5), `hero-c.jpg` (guest watching stream on device, square), `why-livestream.jpg` (emotional remote-guest moment, 3:2), `vendor-cta.jpg` (videographer rig, wide), `og-fallback.jpg`.

Standard image treatment: `rounded-2xl object-cover`; on dark sections add `after:` overlay `bg-gradient-to-t from-ink/60 to-transparent` when text sits on the image.

---

## 2. Header (`src/components/layout/header.tsx`)

- Height `h-20`. Keep sticky + blur.
- **Logo:** drop the generic lucide Heart. Create `src/components/logo.tsx`: an inline SVG mark — a heart outline whose interior contains a small solid play-triangle (heart = wedding, play = stream), stroke `currentColor`, 24×24, `text-primary` — followed by a two-tone wordmark: `font-display text-[22px]`: "WeddingLive" in `font-semibold` + "Streaming" in `font-normal italic text-primary`. This becomes the brand mark everywhere (header, footer, favicon later).
- Nav links: `text-[15px] text-foreground/70 hover:text-foreground`, active route gets `text-foreground` + a 4px `bg-primary` dot or 2px underline offset.
- CTAs: "Sign In" ghost; "List Your Business" primary pill.
- **Mobile menu currently does nothing.** Make it work: a client component using shadcn Sheet pattern or a simple full-screen overlay — serif links at `text-3xl`, staggered fade-in, CTAs at bottom. This is a functional bug fix, required.

## 3. Homepage (`src/app/page.tsx`) — new section order

**Hero → Trust strip → How it works → Why livestream (editorial) → Founding vendors panel → Browse by state → Vendor CTA (ink) → Footer**

### 3.1 Hero — split editorial layout (no more floating text on empty cream)

Two-column on `lg:` (55/45), stacked on mobile:
- **Left:** eyebrow "The Wedding Livestream Directory" · h1 `text-5xl md:text-6xl lg:text-7xl leading-[1.05]`: "Every love story deserves *every guest*" (italic accent on "every guest") · subcopy (keep current, tighten to one sentence) · search bar (§3.2) · trust line below.
- **Right:** an overlapping photo collage: `hero-a` (4:5, large, rounded-2xl) with `hero-c` (square, ~40% width) overlapping its bottom-left corner with a `border-4 border-background shadow-xl`, and a small floating pill card top-right: red pulsing dot + "LIVE · 214 watching from 12 countries" in `text-xs font-medium` on `bg-background/90 backdrop-blur rounded-full px-4 py-2 shadow-lg`. Subtle: one blush radial glow behind the collage (`bg-accent/50 blur-3xl rounded-full` absolute).
- Section background: ivory with a faint radial blush wash top-right only — remove the current full-width vertical gradient.

### 3.2 Search bar (`src/components/search-bar.tsx`)

Replace the native `<select>` (a hard "cheap" signal) with a styled listbox: either add shadcn `Select` (Radix) in `src/components/ui/select.tsx`, or a headless popover listbox. Container: single pill `rounded-full border bg-card shadow-lg shadow-primary/5 p-1.5` with location input (MapPin icon) · thin divider · category trigger · primary pill Search button. Focus state: `ring-2 ring-primary/30`. On mobile, stack into a rounded-2xl column.

### 3.3 Trust strip

Counts are zero, so sell values not numbers — one row, three items separated by thin rules: "Vetted professionals" · "Direct contact — no middlemen" · "Free for couples". `text-sm text-muted-foreground`, each with a small `text-primary` check icon.

### 3.4 How it works — kill the icon-circle cliché

3 columns, left-aligned, each: oversized serif numeral `01` `02` `03` (`font-display text-5xl text-primary/25 italic`), `border-t border-border pt-6`, title `font-display text-2xl`, then body. No circles, no badge numbers, no icons.

### 3.5 NEW section — "Why livestream your wedding" (editorial)

Two-column: `why-livestream.jpg` left (3:2, rounded-2xl, slight `-rotate-1` on a blush offset block behind it), right: eyebrow "Why it matters" · h2 "For the ones who couldn't be there" · 2 short paragraphs (grandparents abroad, guests who can't travel, reliving the day) · an inline pull-quote in `font-display text-2xl italic text-primary` — an editorial line, e.g. "Distance shouldn't decide who watches you say I do." (Do NOT invent attributed customer testimonials — no fake names/reviews.)

### 3.6 Featured vendors → "Founding vendors" panel (replaces dashed empty box)

While `featured.length === 0`, render a designed recruitment panel instead of an apology: full-width `rounded-3xl` card, `vendor-cta.jpg` background with `bg-ink/70` overlay, `text-ink-foreground`, eyebrow "Founding Vendors" · h2 "Claim a founding spot in your city" · one line: first vendors in each market get top placement as the directory grows · gold-outlined pill CTA "Become a Founding Vendor" → `/submit-listing`. Keep the existing grid code path for when listings exist.

### 3.7 Browse by state

Keep pills; restyle: `border-border/70 bg-card px-5 py-2.5 text-sm hover:border-primary/50 hover:bg-accent/40`; center, max-w-4xl. Keep the "All States →" primary pill.

### 3.8 Vendor CTA — the ink moment

Replace the pale gradient card with a full-bleed `bg-ink text-ink-foreground` section (not a card): centered, eyebrow in gold `text-gold`, h2 `text-4xl md:text-5xl font-display` "Get discovered by couples searching in your area", subcopy `text-ink-foreground/70`, two buttons: primary "List Your Business — Free" (bg-background text-foreground pill) + ghost "See Featured pricing" → `/pricing`. Drop the Heart icon.

## 4. Footer (`src/components/layout/footer.tsx`) — make it a brand moment

`bg-ink text-ink-foreground` (footer is the second and last ink moment). Top row: large serif wordmark (`font-display text-3xl`) + tagline italic `text-ink-foreground/60`. Link columns: headings `text-xs uppercase tracking-[0.18em] text-ink-foreground/50`, links `text-[15px] text-ink-foreground/80 hover:text-ink-foreground`. Newsletter (`subscribe-box.tsx`): pill input on `bg-white/10 border-white/15` with embedded primary pill Subscribe button (fix the current washed-out disabled look). Bottom bar: thin `border-white/10` rule, copyright left, "Every love story deserves every guest." italic right.

## 5. Directory (`src/app/directory/page.tsx`)

- Page header: serif h1 + eyebrow, hide "0 vendors found" when count is 0.
- Filters: restyle sidebar as chips/pills; on mobile render categories as a horizontal scrollable chip row above results. Replace any native selects with the §3.2 select.
- **Empty state = lead capture, not apology:** rounded-3xl accent-wash panel: h3 "Vendors are joining city by city" · copy: tell us your date and city and we'll connect you as soon as a vendor covers your area (free) · embed or link the existing `lead-form.tsx` → this converts dead traffic into the leads Joe monetizes later. Secondary line for vendors: "Serve this area? *List your business free.*"
- Listing card (`listing-card.tsx`): bump to `rounded-2xl`, image `aspect-[4/3]`, title `text-lg`, remove "Added {date}" (meaningless to couples), add `hover:shadow-xl hover:-translate-y-1 transition-all duration-300`.

## 6. Pricing (`src/app/pricing/page.tsx`)

- Fix the broken hierarchy on the Featured card ("per month · or $199/year" currently floats above a lonely "$29/mo"): price block = `$29` large serif + `/month` muted, directly under it `text-sm text-muted-foreground` "or $199/year — save 43%".
- Featured card: `bg-ink text-ink-foreground` variant with gold "Most Popular" pill overlapping the top edge, gold check icons; Basic card stays ivory `bg-card`. Dark-vs-light card contrast is the 2026 pricing pattern and makes the upsell obvious.
- Equal card heights, CTAs pinned to bottom.

## 7. Remaining pages — apply the system

`how-it-works`, `for-vendors`, `about`, `contact`, `faq`, `guides/*`, state pages, `listing/[slug]`, auth pages, `not-found.tsx`: apply tokens/typography automatically via globals, then do a pass on each for: serif h1 + eyebrow header block, `container-tight` prose width, chips/cards per system, no dashed borders, no native selects. `not-found.tsx`: oversized italic serif "404", warm copy, two pill CTAs (already close — restyle only).

**State pages:** after the §0.5 routing fix they will render; they already handle zero listings. Restyle their empty state to match the §5 lead-capture panel. Do not touch metadata/canonical logic.

## 8. Motion (restraint = luxury)

- Scroll-reveal: small client `<Reveal>` wrapper (IntersectionObserver, adds `animate-fade-in-up`, threshold 0.15, once). Wrap section headings and card grids. Respect `prefers-reduced-motion` (skip animation entirely).
- Keep existing card hover lift + image zoom. Add the pulsing live-dot keyframe for the hero pill (`animate-pulse` on a 8px red-500 dot is fine).
- Nothing else. No parallax, no marquees, no cursor effects.

## 9. Verify loop (mandatory, per phase)

After each numbered section above: `npm run build` must pass → screenshot the affected page at **1512px and 390px** widths (use the browser tools or Vercel preview) → compare against this spec → fix → re-shoot. Final pass: check text contrast (all body text ≥ 4.5:1 — especially `text-ink-foreground/60` on ink: if it fails, raise to /75), click through every nav link and both mobile menus, confirm Lighthouse/PSI ≥ 90 on home + directory, confirm no layout shift from images (all `next/image` with fixed aspect containers).

## 10. Order of execution & commits

1. §1 design system + §2 header (commit: "design: new type/color system, header + logo")
2. §3 homepage (commit per section group)
3. §4 footer + §6 pricing
4. §5 directory + §7 remaining pages + state-page empty states
5. §8 motion + §9 final QA (commit: "design: motion + QA pass")

Then tell Joe to `git push origin main` and review the Vercel deploy.

---

*Spec complete. Executor: if something in the codebase contradicts this spec (missing file, renamed component), adapt the instruction to the real code rather than skipping it — the design intent is the contract.*
