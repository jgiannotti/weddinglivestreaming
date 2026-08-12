# Vendor outreach: claim your profile → earn the badge link

**Status: drafted, not sent.** Nothing in this file has gone out to anyone. Read it,
change the voice to sound like you, then send it yourself (see "How to send" below).

## Why this is the highest-value off-site play

We have 200 seeded vendors and **154 unique, verified email recipients** — up from 72
before enrichment. Every vendor who adds the badge gives us a backlink from a
wedding/AV business site, exactly the topical neighbourhood Google wants to see
linking to a wedding directory. For a site with no authority yet, that is worth more
than any amount of additional on-page work.

## Building the list (run in this order)

```bash
# 1. Scrape contact emails for vendors whose seed record has none.
#    Re-runnable; records every attempt so it never re-scrapes the same site.
node scripts/enrich-emails.mjs

# 2. Resolve each vendor to its REAL live listing slug (see warning below).
node scripts/resolve-listing-slugs.mjs

# 3. Build the mail-merge CSV.
node scripts/outreach-list.mjs > outreach.csv
```

Current output: **154 recipients** — 104 from the seed data, 50 recovered by
scraping. 68 have an owner first name. 2 duplicate addresses were collapsed (one
operator running two brands), and 9 vendors have no resolvable live listing.

### Two data problems this pipeline fixes — don't bypass it

**1. `suggested_slug` is not the live slug.** The seed field is what the seeding pass
*proposed*; the importer often created something different (usually a missing state
suffix). Building profile links from it sends **39 of 154 vendors to a 404** — a
quarter of the campaign clicking "here's your listing" and landing on an error page.
`resolve-listing-slugs.mjs` matches against the live sitemap instead, and every URL
in the current CSV has been verified to return 200.

**2. Emails come in two shapes.** Older seed records store `contact.emails` as plain
strings, newer ones as `{address, ...}` objects. Reading only `.address` silently
drops 33 vendors. Both shapes are handled now.

The `has_profile` column marks the 9 vendors with no live listing — their `profile`
column points at `/claim` instead. **Use a different first line for those nine**
("I've added your business to the directory — you can find and claim it here")
since "here is your listing" would be wrong.

The badge embed already produces a plain `rel="noopener"` link (no `nofollow`), so
these pass link equity. The generator is live at `/vendor-badge`.

## The sequencing that matters

Do **not** lead with "please link to us." Lead with the thing that's genuinely
valuable to them — they're already listed, the profile is free, and claiming it lets
them respond to couple inquiries. The badge is the second email, after they've had
something useful. Vendors who claimed a profile have a reason to display a badge;
strangers don't.

---

## Email 1 — the claim (send to all 105)

**Subject:** Your free listing on WeddingLiveStreaming.com

> Hi [First name / there],
>
> I run WeddingLiveStreaming.com, a directory for couples looking for someone to
> livestream their ceremony. I built [Business name] a listing because you're one of
> the vendors actually doing this work in [City].
>
> It's live here: [profile URL]
>
> The listing is free and yours to claim — claiming it lets you edit the details, add
> photos, and reply directly to couples who message you. There's no commission and no
> booking fee, ever. If you'd rather not be listed at all, reply and I'll remove it
> same day.
>
> Claim it here: https://www.weddinglivestreaming.com/claim
>
> — Joe
> WeddingLiveStreaming.com

Why this works: it gives before it asks, it's honest that we created the listing
without asking, and the opt-out is unconditional and immediate. That last part is
what keeps this from feeling like spam — and it's the right thing to do regardless.

---

## Email 2 — the badge (only to vendors who claimed, ~1 week later)

**Subject:** A badge for your site

> Hi [First name],
>
> Thanks for claiming your profile. One thing that helps both of us: we make a
> "Featured on WeddingLiveStreaming.com" badge you can drop on your own site. Couples
> comparing vendors tend to trust a business that shows up in an independent
> directory, and it links straight back to your profile so anyone who clicks it lands
> on your listing.
>
> Grab the embed code here (takes about 30 seconds):
> https://www.weddinglivestreaming.com/vendor-badge
>
> Light and dark versions, and the code is one line of HTML.
>
> — Joe

---

## How to send — read before you do

**Don't blast all 105 from the Resend domain you use for transactional mail.** Lead
confirmations, welcome emails, and password resets all flow through that reputation.
A cold batch that draws spam complaints can damage delivery for the mail that
actually matters.

Safer approach:

1. **Send in batches of ~20**, a day or two apart. Watch bounces and complaints
   between batches.
2. **Send from your personal address** (joe@) rather than a bulk sender for the first
   batches — it's a genuinely personal email, it should look like one, and replies
   come straight to you.
3. **Personalise the merge fields for real.** The CSV carries `business`, `city`,
   `state`, and a verified `profile` for every row, plus `first_name` for 68 of the
   154. A vendor who sees their actual city treats it as a real email; one who sees a
   literal `[City]` treats it as spam. For the 86 rows with no first name, use "Hi
   there" — never leave a visible placeholder.
4. **CAN-SPAM:** because this promotes a commercial service, include a physical
   mailing address and an opt-out. The "reply and I'll remove it" line covers opt-out
   intent, but add your address in the signature to be properly compliant.
5. **Skip anyone who already claimed** — check the dashboard first so nobody gets a
   "claim your listing" email for a listing they already own.

## Tracking whether it worked

The badge embed already appends `?utm_source=vendor-badge`, so clicks show up in
Vercel Analytics. For the links themselves, check Google Search Console → Links after
a few weeks; badge backlinks appear there once Google recrawls the vendor sites.

## What I'd expect

Cold outreach to vendors about a free listing they're already in typically sees
20–40% open and 10–20% action, because the offer is genuinely free and specific to
them. Of those who claim, maybe half will add a badge if asked well. Rough
expectation from 154 emails: 20–40 claims, 10–20 badge backlinks. That is a
meaningful authority change for a site starting from zero — and the claims matter in
their own right, since a claimed listing is a vendor who might later pay for
Featured.

These are rough industry-shaped estimates, not predictions from our own data; we have
no send history yet to calibrate against. The first batch of 20 is what turns this
into a real forecast.
