-- ----------------------------------------------------------------------------
-- 0013 — Migrate identity from Supabase Auth to Clerk
--
-- Joe moved auth to Clerk (2026-07-25) after 71 bot accounts signed up through
-- the Supabase email form in 12 days. Clerk ships Cloudflare Turnstile bot
-- protection, lockout, and MFA out of the box on his existing Pro workspace.
--
-- DESIGN — the cheap seam:
-- The obvious migration (retype profiles.id from uuid to Clerk's text user id)
-- would cascade through 8 foreign keys across vendors, messages, favorites,
-- claim_requests and reports, and rewrite every row of real vendor data. We do
-- NOT do that. Instead profiles.id stays a uuid and stays the app's internal
-- identity; we only change how "who is calling" is RESOLVED:
--
--   before:  auth.uid()                      -- uuid, from Supabase Auth
--   after:   public.current_profile_id()     -- uuid, from Clerk's JWT sub
--
-- Every existing FK, index and row is untouched. Only the resolution layer and
-- the policies that call it change. This also means the migration is reversible
-- by pointing current_profile_id() back at auth.uid().
--
-- Clerk is registered as a Supabase third-party auth provider, so Clerk session
-- tokens arrive as a normal Postgres `authenticated` role with the Clerk user
-- id in the `sub` claim. Profile ROWS are created server-side with the service
-- role key (see src/lib/auth.ts ensureProfile), replacing the old
-- on_auth_user_created trigger, which cannot fire any more.
--
-- The 71 bot rows in auth.users are deliberately left in place, not deleted —
-- auth.users is now vestigial and reading it is harmless. Clean up at leisure.
-- ----------------------------------------------------------------------------

begin;

-- 1. Profiles gain a Clerk identity column -----------------------------------

alter table public.profiles
  add column if not exists clerk_user_id text;

-- Two profiles must never claim the same Clerk account.
create unique index if not exists idx_profiles_clerk_user_id
  on public.profiles (clerk_user_id)
  where clerk_user_id is not null;

-- profiles.id no longer mirrors auth.users.id. Drop the FK so profile rows can
-- exist (and be created by the app) without a Supabase Auth user behind them.
-- Existing rows keep their uuids, so every vendors.user_id / messages.from_user_id
-- / claim_requests.user_id reference stays valid.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Rows created from here on generate their own uuid.
alter table public.profiles
  alter column id set default gen_random_uuid();

-- 2. Identity resolution ------------------------------------------------------

-- The Clerk user id ("user_2abc...") carried in the verified JWT.
create or replace function public.clerk_sub()
returns text
language sql stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

-- The internal profiles.id for whoever is calling. NULL when signed out.
-- SECURITY DEFINER so it can read profiles without tripping profiles' own RLS
-- (same technique 0006 used to break the policy recursion cycles).
create or replace function public.current_profile_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.clerk_user_id = public.clerk_sub()
  limit 1;
$$;

revoke all on function public.clerk_sub() from public;
revoke all on function public.current_profile_id() from public;
grant execute on function public.clerk_sub() to anon, authenticated;
grant execute on function public.current_profile_id() to anon, authenticated;

-- 3. Repoint the 0006 / 0009 helpers off auth.uid() ---------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_profile_id() and role = 'admin'
  );
$$;

create or replace function public.current_vendor_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.vendors where user_id = public.current_profile_id();
$$;

-- 0009's escalation guard: role changes only ever happen inside SECURITY
-- DEFINER functions, never through a client UPDATE. Unchanged except for the
-- identity source.
create or replace function public.become_vendor()
returns void
language sql security definer
set search_path = public
as $$
  update public.profiles set role = 'vendor'
  where id = public.current_profile_id() and role = 'couple';
$$;

revoke all on function public.become_vendor() from public;
grant execute on function public.become_vendor() to authenticated;

-- 4. Policies that referenced auth.uid() directly ------------------------------
-- (Policies already routed through is_admin() / current_vendor_ids() in 0006
-- need no change — they inherit the new resolution automatically.)

-- profiles ---------------------------------------------------------------
drop policy if exists "users see their own profile" on public.profiles;
create policy "users see their own profile" on public.profiles
  for select using (id = public.current_profile_id());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile" on public.profiles
  for update using (id = public.current_profile_id());

-- vendors ----------------------------------------------------------------
-- NOTE: user_id is nullable since 0008 (seeded/unclaimed vendors). Postgres
-- would evaluate NULL = NULL as NULL (not true), so unclaimed rows stay
-- admin/service-role only, exactly as before. The explicit guards below make
-- that intent unmistakable rather than incidental.
drop policy if exists "vendors manage their own record" on public.vendors;
create policy "vendors manage their own record" on public.vendors
  for all
  using (user_id is not null and user_id = public.current_profile_id())
  with check (user_id is not null and user_id = public.current_profile_id());

-- messages ---------------------------------------------------------------
drop policy if exists "messages visible to participants" on public.messages;
create policy "messages visible to participants" on public.messages
  for select using (
    from_user_id = public.current_profile_id()
    or to_vendor_id in (select public.current_vendor_ids())
  );

drop policy if exists "anyone authenticated can send a message" on public.messages;
create policy "anyone authenticated can send a message" on public.messages
  for insert with check (from_user_id = public.current_profile_id());

-- favorites --------------------------------------------------------------
drop policy if exists "favorites are user-owned" on public.favorites;
create policy "favorites are user-owned" on public.favorites
  for all
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- claim_requests ---------------------------------------------------------
-- Keeps 0009's full guard set: own row + pending + target vendor unclaimed.
drop policy if exists "users submit their own claims" on public.claim_requests;
create policy "users submit their own claims" on public.claim_requests
  for insert to authenticated
  with check (
    user_id = public.current_profile_id()
    and status = 'pending'
    and public.listing_vendor_unclaimed(listing_id)
  );

drop policy if exists "users see their own claims" on public.claim_requests;
create policy "users see their own claims" on public.claim_requests
  for select to authenticated
  using (user_id = public.current_profile_id());

-- 5. Retire the Supabase Auth signup trigger ----------------------------------
-- auth.users receives no new rows now, so this can never fire again. Dropping
-- it prevents a future re-enable of Supabase Auth from silently creating
-- orphan profile rows with no clerk_user_id.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 6. Link the existing admin account -------------------------------------------
-- Joe's profile row (and its admin role) is preserved and adopted by whichever
-- Clerk account verifies joe@floridasoundman.com — the link itself is made by
-- ensureProfile() in the app, which only ever matches on a Clerk-VERIFIED
-- email address, so an unverified signup cannot inherit the admin row.
-- Nothing to do here; documented so the mechanism isn't a surprise later.

commit;
