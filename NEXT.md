# Next steps — what to do right now

The full v1 is built and committed locally. Three things stand between us and a live preview URL. None require coding.

## 1. Push to GitHub (2 minutes)

Create a new empty repo at <https://github.com/new>:
- Repository name: `weddinglivestreaming`
- Visibility: **Private** (recommended — keeps your code private)
- **Don't** initialize with a README, .gitignore, or license (we already have those)

Click "Create repository". On the next page, GitHub shows commands. Run these in your Terminal:

```bash
cd "/Users/joe/Documents/Claude/Projects/weddinglivestreaming.com"
git remote add origin https://github.com/YOUR-USERNAME/weddinglivestreaming.git
git push -u origin main
```

(Replace YOUR-USERNAME with your GitHub username.)

## 2. Create the Supabase project (5 minutes)

- Go to <https://supabase.com/dashboard/new/wsg-org-id>
- Sign in with GitHub
- Click "New project":
  - Name: `weddinglivestreaming`
  - Database password: generate a strong one (Supabase has a button), save it somewhere safe
  - Region: closest to you (US East is fine if you're not sure)
- Wait ~2 minutes for it to provision
- Once ready, go to **SQL Editor** → New query → paste the contents of `supabase/migrations/0001_initial.sql` → Run
- Then do the same with `supabase/migrations/0002_helpers.sql`
- Go to **Storage** → New bucket → name it `listings` → toggle **Public bucket** ON → Create
- Go to **Settings → API** and copy these three values into a note for me:
  - **Project URL** (looks like `https://abcdefg.supabase.co`)
  - **anon public** key (long string starting with `eyJ`)
  - **service_role secret** key (long string, also starts with `eyJ` — keep this private!)

## 3. Import to Vercel (2 minutes)

- Go to <https://vercel.com/new>
- Find the `weddinglivestreaming` repo you just pushed
- Click "Import"
- **Don't deploy yet** — first click "Environment Variables" and add:
  - `NEXT_PUBLIC_SITE_URL` → `https://weddinglivestreaming.com` (we'll change to your Vercel preview URL after first deploy)
  - `NEXT_PUBLIC_SUPABASE_URL` → (the Project URL from step 2)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → (the anon key from step 2)
  - `SUPABASE_SERVICE_ROLE_KEY` → (the service_role key from step 2)
- Click Deploy
- Wait ~2 minutes for the build
- You'll get a URL like `weddinglivestreaming-abc123.vercel.app`

That gives us a working preview deploy with all 104 vendors importable. After that, we add Resend, Stripe, and PayPal one at a time.

## Tell me when each step is done

Just say "done with #1" or paste the Supabase keys when you have them. We can also work through any step together — I'll guide you click-by-click if helpful.
