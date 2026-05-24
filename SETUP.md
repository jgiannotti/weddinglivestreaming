# Setup Guide (for non-developers)

This is the step-by-step setup for getting the new site running. You can do this yourself, or we can do it together in our next session.

**Estimated time:** ~30 minutes for accounts, ~10 min to wire everything up.

## What you need to sign up for

All free. None of these require a credit card for the free tier.

### 1. GitHub (for code hosting)
- Go to <https://github.com/signup>
- Pick any username
- This is where the code lives and how Vercel auto-deploys

### 2. Vercel (for hosting the site)
- Go to <https://vercel.com/signup>
- Click "Continue with GitHub" — uses the account from step 1
- Hobby tier is free forever for this kind of site

### 3. Supabase (database + auth + file storage)
- Go to <https://supabase.com>
- Sign up with GitHub
- Create a new project:
  - Name: `weddinglivestreaming`
  - Database password: generate a strong one and save it somewhere safe
  - Region: pick whatever's closest to you (US East is fine)
- Wait ~2 min for provisioning
- Once ready: go to Settings → API and copy these three values:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Resend (for sending emails)
- Go to <https://resend.com>
- Sign up
- Add and verify your domain (`weddinglivestreaming.com`) — they walk you through the DNS records
- Create an API key under API Keys → put in `RESEND_API_KEY`

### 5. Stripe (for credit card subscriptions)
Since you already have a Stripe account for another business, create a separate one here for clean reporting:
- Go to <https://dashboard.stripe.com/register>
- Sign up with a different email (or use Stripe's "+ Add Account" if signed in)
- Activate the account with your business info
- Create two recurring products:
  - **Featured Monthly** — $29 USD recurring monthly
  - **Featured Annual** — $199 USD recurring yearly
- Copy the API keys from Developers → API keys → `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Copy each product's price ID (starts with `price_…`) → `STRIPE_PRICE_FEATURED_MONTHLY` and `STRIPE_PRICE_FEATURED_ANNUAL`

### 6. PayPal (for PayPal subscriptions)
- Go to <https://developer.paypal.com>
- Log in with your PayPal business account
- Apps & Credentials → Create App → name it "WeddingLiveStreaming"
- Copy Client ID → `PAYPAL_CLIENT_ID` + `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- Copy Secret → `PAYPAL_CLIENT_SECRET`
- Create two subscription plans (under "Catalog" in PayPal dashboard) matching the Stripe ones, copy the plan IDs → `PAYPAL_PLAN_FEATURED_MONTHLY` and `PAYPAL_PLAN_FEATURED_ANNUAL`

## After accounts are created

### Step A — push the code to GitHub
We'll do this together. The command is:
```bash
cd /Users/joe/Documents/Claude/Projects/weddinglivestreaming.com
git init
git add .
git commit -m "Initial scaffold"
gh repo create weddinglivestreaming --public --source=. --push
```
(Requires the GitHub CLI; alternative: create an empty repo on GitHub.com and follow their "push existing" instructions.)

### Step B — run the database schema
1. Open your Supabase project
2. Go to SQL Editor → New query
3. Paste the entire contents of `supabase/migrations/0001_initial.sql`
4. Click Run
5. Should see "Success. No rows returned."

### Step C — create a storage bucket
1. In Supabase, go to Storage → New bucket
2. Name: `listings`
3. **Make it public** (vendor photos need to be accessible)

### Step D — connect Vercel
1. In Vercel: Add New → Project → import the GitHub repo
2. Add all the environment variables from your `.env.local` to Vercel's Environment Variables panel
3. Deploy

### Step E — migrate your old data
Once Supabase is wired up:
```bash
npm run migrate:wp
```
This scrapes your existing WordPress site and imports all 104+ listings into the new database.

### Step F — point the domain
1. In Vercel: Settings → Domains → Add `weddinglivestreaming.com`
2. In GoDaddy: change the nameservers (Vercel shows you the exact values)
3. Wait 1–24 hours for DNS to propagate
4. Done — your new site is live at the same URL

## What to do at each milestone

- **Milestone 1** ✅ (done) — Plan approved
- **Milestone 2** (you're here) — Click through the preview HTML and the local dev site. Tell me what to change about the design, copy, or functionality.
- **Milestone 3** (before DNS swap) — Final smoke test on staging, then we cut over.

## Help

Anything unclear — open a new chat in this folder and we'll pick up exactly where we left off. The agent reads `PLAN.md`, `README.md`, and project memory automatically.
