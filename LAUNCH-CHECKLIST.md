# Launch Checklist

Use this when you're ready to put the new site live.

## Pre-launch (Joe)

- [ ] All accounts created (see `SETUP.md`): GitHub, Vercel, Supabase, Resend, Stripe, PayPal
- [ ] Domain registrar GoDaddy login confirmed
- [ ] `.env.local` filled in with all keys

## Pre-launch (Claude, next session)

- [ ] Run `npm install` to install dependencies
- [ ] Push DB schema: paste `supabase/migrations/0001_initial.sql` + `0002_helpers.sql` into Supabase SQL Editor
- [ ] Create `listings` storage bucket (public) in Supabase
- [ ] Create admin user: in Supabase Auth, manually add `joe@floridasoundman.com`, then set `role = 'admin'` in the `profiles` table
- [ ] Run `npm run migrate:wp` to import all 104 vendors
- [ ] Verify migration: visit `/directory` locally and confirm all listings appear with photos
- [ ] Set up Resend domain verification (DNS records at GoDaddy)
- [ ] Create Stripe products: $29/mo and $199/yr, copy price IDs into env
- [ ] Create PayPal subscription plans matching, copy plan IDs into env
- [ ] Test full flows locally:
  - [ ] Browse directory, click a listing
  - [ ] Sign up as new vendor → submit listing → admin approves
  - [ ] Sign up as couple → message a vendor → vendor receives email
  - [ ] Upgrade to Featured via Stripe (test mode)
  - [ ] Upgrade to Featured via PayPal (sandbox)

## Deploy

- [ ] Push code to GitHub (`gh repo create … --push`)
- [ ] Import repo into Vercel
- [ ] Add all env vars to Vercel (Production + Preview)
- [ ] Configure Stripe webhook: `https://[vercel-preview]/api/webhooks/stripe`, copy signing secret → `STRIPE_WEBHOOK_SECRET`
- [ ] Configure PayPal webhook: `https://[vercel-preview]/api/webhooks/paypal`
- [ ] Verify staging deploy looks good

## DNS cutover

- [ ] In Vercel: Settings → Domains → Add `weddinglivestreaming.com` and `www.weddinglivestreaming.com`
- [ ] Vercel will show you the DNS records to add. There are two options:
  - **Option A (easier):** Change GoDaddy nameservers to Vercel's nameservers
  - **Option B (keeps GoDaddy nameservers):** Add an A record pointing to `76.76.21.21` and a CNAME for `www` pointing to `cname.vercel-dns.com`
- [ ] Wait 1–24 hours for DNS to propagate (use `dig` or <https://dnschecker.org>)
- [ ] Visit https://weddinglivestreaming.com — should show new site

## Post-launch

- [ ] Verify Google Search Console (Settings → Property → Verify)
- [ ] Submit `/sitemap.xml` to Search Console
- [ ] Test live Stripe payment with a real card (small test transaction, refund yourself)
- [ ] Test live PayPal subscription
- [ ] Email existing vendors: "Your listing has moved — set a new password" (send via Resend bulk)
- [ ] Monitor Vercel Analytics for traffic, errors

## Rollback plan

If something breaks within 24 hours:
- In GoDaddy, point DNS back to the old WordPress host
- The new Supabase data stays intact — we can fix and re-deploy when ready

## Estimated downtime during cutover: zero

DNS propagation is gradual, but Vercel serves the new site to anyone whose DNS has updated while old WordPress serves anyone whose hasn't. No outage window needed.
