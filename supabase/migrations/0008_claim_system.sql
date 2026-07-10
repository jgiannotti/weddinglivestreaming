-- ----------------------------------------------------------------------------
-- 0008 — Claim-your-profile system for seeded vendors
--
-- The DB is being seeded with real vendors scraped from the public web
-- (separate workstream — see SEED-CONTRACT.md). Seeded vendors have no
-- account, so:
--   * vendors.user_id becomes nullable. NULL user_id = unclaimed profile.
--   * vendors.source records provenance ('signup' | 'seeded').
--   * vendors.claimed_at records when a claim was approved.
--   * claim_requests (existed since 0001 with no UI and no RLS) gets
--     insert/select policies and an atomic admin approval function.
--
-- RLS interactions (post-0006 helpers): current_vendor_ids() only returns
-- vendors whose user_id = auth.uid(), so NULL-owner rows are manageable
-- exclusively by admins/service-role until claimed. Public visibility of
-- seeded listings works unchanged ("approved listings are public").
-- ----------------------------------------------------------------------------

begin;

-- 1. Vendors: allow ownerless (seeded) rows + provenance ---------------------

alter table public.vendors alter column user_id drop not null;

alter table public.vendors
  add column if not exists source text not null default 'signup'
    check (source in ('signup', 'seeded')),
  add column if not exists claimed_at timestamptz;

-- Every pre-existing vendor row came from a real signup.
update public.vendors set claimed_at = created_at where user_id is not null and claimed_at is null;

-- 2. claim_requests: RLS ------------------------------------------------------

alter table public.claim_requests enable row level security;

drop policy if exists "users submit their own claims" on public.claim_requests;
create policy "users submit their own claims" on public.claim_requests
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "users see their own claims" on public.claim_requests;
create policy "users see their own claims" on public.claim_requests
  for select to authenticated
  using (user_id = auth.uid());

-- ("admins see all claims" already recreated via is_admin() in 0006.)

-- 3. Atomic approval ----------------------------------------------------------
-- Approving a claim must, in one transaction: attach the claimant to the
-- vendor, stamp claimed_at, upgrade their profile role, mark the claim
-- approved, and auto-reject competing pending claims on the same listing.

create or replace function public.approve_claim_request(claim_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select cr.*, l.vendor_id into c
  from public.claim_requests cr
  join public.listings l on l.id = cr.listing_id
  where cr.id = claim_id
  for update;

  if c is null then
    raise exception 'claim not found';
  end if;
  if c.status <> 'pending' then
    raise exception 'claim is not pending';
  end if;

  v_id := c.vendor_id;

  if exists (select 1 from public.vendors where id = v_id and user_id is not null) then
    raise exception 'vendor is already claimed';
  end if;

  update public.vendors
     set user_id = c.user_id, claimed_at = now(), updated_at = now()
   where id = v_id;

  update public.profiles set role = 'vendor'
   where id = c.user_id and role = 'couple';

  update public.claim_requests set status = 'approved' where id = claim_id;

  -- Competing pending claims on any listing of this vendor lose automatically.
  update public.claim_requests set status = 'rejected'
   where status = 'pending'
     and id <> claim_id
     and listing_id in (select id from public.listings where vendor_id = v_id);
end;
$$;

revoke all on function public.approve_claim_request(uuid) from public;
grant execute on function public.approve_claim_request(uuid) to authenticated;

commit;
