-- ----------------------------------------------------------------------------
-- 0009 — privilege-escalation fix + claim-spam hardening
--
-- CRITICAL (found in pre-deploy security review, 2026-07-10): the 0001 policy
--   "users update their own profile" ... for update using (id = auth.uid())
-- had no column restriction, and `authenticated` held table-wide UPDATE. Any
-- signed-in user could PATCH their own profiles.role to 'admin' with the
-- public anon key — and is_admin() (0006) trusts that column, unlocking
-- admin RLS on every table AND approve_claim_request() vendor takeover.
--
-- Fix: column-level grants. Users may update only cosmetic columns; role
-- changes happen exclusively through SECURITY DEFINER functions with their
-- own guards (become_vendor here, approve_claim_request from 0008).
-- ----------------------------------------------------------------------------

begin;

-- 1. Kill the escalation --------------------------------------------------

revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Replaces the client-side `update profiles set role='vendor'` in
-- submit-listing (which the column grant would otherwise break).
create or replace function public.become_vendor()
returns void
language sql security definer
set search_path = public
as $$
  update public.profiles set role = 'vendor'
  where id = auth.uid() and role = 'couple';
$$;

revoke all on function public.become_vendor() from public;
grant execute on function public.become_vendor() to authenticated;

-- 2. Claim-request hardening (defense in depth vs API-bypass spam) ---------

-- One pending claim per user per listing, enforced by the DB not the API.
create unique index if not exists idx_claim_requests_one_pending
  on public.claim_requests (listing_id, user_id)
  where status = 'pending';

-- Claims may only target listings whose vendor is actually unclaimed.
create or replace function public.listing_vendor_unclaimed(l_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings l
    join public.vendors v on v.id = l.vendor_id
    where l.id = l_id
      and l.status = 'approved'
      and v.user_id is null
  );
$$;

revoke all on function public.listing_vendor_unclaimed(uuid) from public;
grant execute on function public.listing_vendor_unclaimed(uuid) to authenticated;

drop policy if exists "users submit their own claims" on public.claim_requests;
create policy "users submit their own claims" on public.claim_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and public.listing_vendor_unclaimed(listing_id)
  );

commit;
