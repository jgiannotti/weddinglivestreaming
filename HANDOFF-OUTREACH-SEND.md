# Handoff: send the vendor outreach campaign via Resend

**For: the Cowork session with access to Joe's Resend account.**
**Repo:** `weddinglivestreaming.com` · **Branch:** `main`

Everything is built and tested. Your job is to configure the sending domain, run a
dry run, get Joe's sign-off, then send in batches and report results. **No email has
been sent to anyone yet.**

---

## What this campaign is

We seeded ~200 wedding-livestream vendors into the directory from their own public
websites. They don't know they're listed. This campaign tells them, invites them to
claim the free listing, and — in a later follow-up — offers a "Featured on
WeddingLiveStreaming.com" badge for their site.

**The strategic point is the badge, not the claim.** The site has effectively zero
backlinks, which is the main thing capping its search visibility. Every vendor who
installs the badge gives us a followed link from a wedding/AV business site. The
claim email comes first because leading with "please link to us" doesn't work; giving
them something free does.

Secondary benefit: a claimed listing is a vendor who might later pay for Featured
($29/mo), which is the site's revenue model.

---

## Current state — verified, not assumed

| Thing | Value |
|---|---|
| Recipients | **154** unique, deduplicated addresses |
| Source | 104 from seed data, 50 recovered by scraping vendor sites |
| Personalisation | 68 have an owner first name; the rest get "Hi there" |
| Profile links | **All 154 verified to return HTTP 200** |
| Vendors with no live listing | 9 — their link points at `/claim` and their copy differs |
| Emails sent so far | **0** |

---

## Step 1 — Decide the sending domain (do this first)

Joe has a Resend account for `weddinglivestreaming.com`. The app already uses it for
transactional mail: welcome emails, lead notifications, password resets, claim
alerts.

**The risk:** cold outreach and transactional mail share a sending reputation. If
this campaign draws spam complaints on the main domain, password resets and lead
alerts start landing in spam. That is a significantly worse outcome than the campaign
underperforming.

**Recommended:** add a subdomain in Resend — `mail.weddinglivestreaming.com` — and
send from there. Reputation is isolated, the root domain stays clean, and it's the
right setup if outreach ever becomes recurring. It's a new domain in the Resend
dashboard plus a few DNS records at the registrar (GoDaddy).

Then set:

```bash
export OUTREACH_FROM="Joe <joe@mail.weddinglivestreaming.com>"
export OUTREACH_REPLY_TO="joe@weddinglivestreaming.com"   # replies go to the real inbox
```

**If Joe would rather not add DNS records,** sending from the main domain is
acceptable *provided* you keep batches small (20/day) and stop at the first sign of
complaints. Confirm the choice with him — don't assume.

The script defaults to `joe@weddinglivestreaming.com` if you set nothing.

---

## Step 2 — Get the API key

`RESEND_API_KEY` is **not** in `.env.local`. It lives in the Vercel project settings
(project `weddinglivestreaming`, team `joes-projects-82cbf60c`), or you can mint a new
key in the Resend dashboard.

```bash
export RESEND_API_KEY="re_..."
```

The script refuses to send without it.

---

## Step 3 — Build the list

Run from the repo root, in this order:

```bash
node scripts/enrich-emails.mjs          # optional; already run, re-runnable, skips done
node scripts/resolve-listing-slugs.mjs  # re-run if listings changed since 2026-08-08
node scripts/outreach-list.mjs > outreach.csv
```

`outreach.csv` is gitignored on purpose — it holds contact data. Regenerate it, don't
commit it.

**Re-run `resolve-listing-slugs.mjs` before sending.** It resolves each vendor to
their *live* listing slug from the sitemap. The seed field `suggested_slug` is only a
proposal and 404s for about a quarter of vendors — linking a vendor to a dead
"your listing" page would sink the campaign. If listings have been added or
re-slugged since this handoff, re-running keeps the links honest.

---

## Step 4 — Dry run, then get sign-off

```bash
node scripts/send-outreach.mjs --limit 20
```

Dry run is the **default** — `--send` is required to send anything. It prints a
faithful plain-text rendering of the first couple of emails.

**Show Joe the dry-run output and get explicit approval before Step 5.** He has
approved the campaign in principle and supplied the postal address; he has not
approved a specific send.

---

## Step 5 — Send in batches

```bash
node scripts/send-outreach.mjs --limit 20 --send
```

Then **stop and check** before the next batch:

- Resend dashboard: bounces and complaints for the batch
- Joe's inbox: replies, especially "remove me"
- Site: any new claims coming through

Wait a day between batches. Roughly 8 batches to cover all 154.

**Do not raise `--limit` to blast the whole list.** A burst of cold email from a
domain with no sending history is the single most reliable way to get filtered.

### Safety properties already built in

- Dry run by default; `--send` required.
- Every success is written to `seed/outreach-sent.json` immediately — **re-running
  can never double-send**, even if a batch dies halfway.
- `seed/outreach-suppression.txt` (one address per line) is always excluded.
- 2.5s throttle between sends (`OUTREACH_THROTTLE_MS` to adjust).
- `List-Unsubscribe` header for one-click opt-out.
- CAN-SPAM postal address in the footer: `4724 Travertine Dr, Tampa, FL 33615`.

---

## Step 6 — Handle replies (this part is not automated)

**Anyone who asks to be removed:**

1. Add their address to `seed/outreach-suppression.txt` immediately.
2. Actually remove or unpublish their listing — the email promises "I'll remove it
   same day." That promise has to be kept; it's the thing that makes this outreach
   legitimate rather than spam.

**Anyone who claims a listing:** they become the audience for the badge follow-up
(email 2 in `OUTREACH-VENDOR-BADGE.md`), roughly a week later. Only send that to
vendors who actually claimed.

---

## Step 7 — Report back

After each batch, tell Joe: sent, bounced, complaints, replies, removal requests, and
new claims. After 2–3 batches there's enough signal to judge whether the copy is
working or needs a rewrite before burning the rest of the list.

Track badge backlinks in Google Search Console → Links (they take a few weeks to
appear), and badge clicks in Vercel Analytics via the `?utm_source=vendor-badge`
parameter the embed already appends.

---

## Files

| Path | Purpose |
|---|---|
| `scripts/enrich-emails.mjs` | Scrapes vendor sites for public contact emails |
| `scripts/resolve-listing-slugs.mjs` | Maps vendors to real live listing slugs |
| `scripts/outreach-list.mjs` | Builds the deduplicated merge CSV |
| `scripts/send-outreach.mjs` | Sends via Resend (dry run by default) |
| `OUTREACH-VENDOR-BADGE.md` | Campaign rationale + email 2 (badge follow-up) |
| `seed/outreach-sent.json` | Send log — created on first real send |
| `seed/outreach-suppression.txt` | Opt-outs; create as needed |

## Things not to do

- Don't send without a dry run reviewed by Joe.
- Don't edit `seed/outreach-sent.json` to "retry" — it exists to prevent double-sends.
- Don't commit `outreach.csv` or any file containing vendor email addresses.
- Don't send the badge email (email 2) to vendors who haven't claimed.
- Don't promise removal and not do it.
