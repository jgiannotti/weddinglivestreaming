-- ----------------------------------------------------------------------------
-- 0006 — RLS infinite-recursion fix (42P17)
--
-- Present since 0001 but masked because the listings table was empty and the
-- app's data layer swallows query errors (returns []). Every anon/authenticated
-- query against listings, vendors, or profiles errored with:
--   "infinite recursion detected in policy for relation ..."
--
-- Two cycles:
--   1. listings."vendor owners manage their listings" subqueries vendors,
--      whose "vendors of approved listings are public" subqueries listings.
--   2. profiles."admins see all profiles" subqueries profiles itself — and
--      every other table's admin policy subqueries profiles, inheriting the
--      recursion.
--
-- Fix: SECURITY DEFINER helper functions. Policy subqueries run through these
-- helpers, which bypass RLS on the tables they read, breaking the cycles.
-- This does not widen access: each helper exposes only the exact boolean/set
-- the old inline subqueries computed.
-- ----------------------------------------------------------------------------

begin;

-- 1. Helpers -----------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_vendor_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.vendors where user_id = auth.uid();
$$;

create or replace function public.vendor_has_approved_listing(v_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listings l
    where l.vendor_id = v_id and l.status = 'approved'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_vendor_ids() from public;
revoke all on function public.vendor_has_approved_listing(uuid) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_vendor_ids() to anon, authenticated;
grant execute on function public.vendor_has_approved_listing(uuid) to anon, authenticated;

-- 2. profiles — break the self-reference -------------------------------------

drop policy if exists "admins see all profiles" on public.profiles;
create policy "admins see all profiles" on public.profiles
  for all using (public.is_admin());

-- 3. listings <-> vendors — break the cross-reference ------------------------

drop policy if exists "vendor owners manage their listings" on public.listings;
create policy "vendor owners manage their listings" on public.listings
  for all
  using (vendor_id in (select public.current_vendor_ids()))
  with check (vendor_id in (select public.current_vendor_ids()));

drop policy if exists "vendors of approved listings are public" on public.vendors;
create policy "vendors of approved listings are public" on public.vendors
  for select using (public.vendor_has_approved_listing(id));

-- 4. Remaining admin policies (all previously recursed through profiles) -----

drop policy if exists "admins see all listings" on public.listings;
create policy "admins see all listings" on public.listings
  for all using (public.is_admin());

drop policy if exists "admins see all vendors" on public.vendors;
create policy "admins see all vendors" on public.vendors
  for all using (public.is_admin());

drop policy if exists "admins see all messages" on public.messages;
create policy "admins see all messages" on public.messages
  for all using (public.is_admin());

drop policy if exists "admins see all claims" on public.claim_requests;
create policy "admins see all claims" on public.claim_requests
  for all using (public.is_admin());

drop policy if exists "admins see all reports" on public.reports;
create policy "admins see all reports" on public.reports
  for all using (public.is_admin());

drop policy if exists "admins see all subscriptions" on public.subscriptions;
create policy "admins see all subscriptions" on public.subscriptions
  for all using (public.is_admin());

drop policy if exists "admins manage all leads" on public.leads;
create policy "admins manage all leads" on public.leads
  for all using (public.is_admin());

drop policy if exists "admins manage all subscribers" on public.subscribers;
create policy "admins manage all subscribers" on public.subscribers
  for all using (public.is_admin());

-- 5. Vendor-scoped policies that subqueried vendors directly -----------------

drop policy if exists "messages visible to participants" on public.messages;
create policy "messages visible to participants" on public.messages
  for select using (
    from_user_id = auth.uid()
    or to_vendor_id in (select public.current_vendor_ids())
  );

drop policy if exists "vendor subscriptions are owner-only" on public.subscriptions;
create policy "vendor subscriptions are owner-only" on public.subscriptions
  for select using (vendor_id in (select public.current_vendor_ids()));

drop policy if exists "vendors see leads matched to them" on public.leads;
create policy "vendors see leads matched to them" on public.leads
  for select using (
    exists (
      select 1 from unnest(leads.matched_vendor_ids) as m(vid)
      where m.vid in (select public.current_vendor_ids())
    )
  );

commit;
