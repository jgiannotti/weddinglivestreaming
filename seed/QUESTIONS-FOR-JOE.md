# Questions / calls for Joe (append-only)

## 2026-07-10 — Production directory appears to show ZERO listings (likely bug, needs the web-dev chat)

While fetching `existing-live-slugs.txt` for dedup, I found:
- `https://www.weddinglivestreaming.com/sitemap.xml` contains only static pages and the 51 `/wedding-live-streaming-[state]` pages — no `/listing/` or `/vendor/` URLs at all.
- The `/directory` page (both raw HTML and JS-rendered via browser) shows the "Vendors are joining city by city" empty-state lead-capture form instead of any vendor cards.
- Searching `/directory?location=Florida` — a state project memory says has vendors — also returns the same empty state, zero results.

Project memory records ~104 vendors migrated from WordPress and live as of 2026-07-08 launch. Either those never actually landed in the `listings` table the site queries, RLS/query logic is filtering everything out, or something regressed since. **This looks like a real production bug**, separate from this seeding task (which only writes local `seed/` files and never touches `src/` or the DB per the hard constraints here). Flagging so you can point your web-dev chat at it — a directory that shows no vendors to any visitor is a significant, revenue-affecting issue if real.

Impact on this seeding work: `existing-live-slugs.txt` is effectively empty, so dedup against "already-live" vendors isn't currently possible from the public site. I'm proceeding with query/domain-level dedup only (within this seed batch); once the directory bug is resolved, worth a pass to cross-check newly-seeded vendors against the real live list before import.
