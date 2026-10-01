-- ----------------------------------------------------------------------------
-- 0018 — founding-vendor offer: grant it once, in one transaction, and record
--        the grant where a vendor cannot reach it
--
-- The offer (decided 2026-10-01): an owned, approved listing with a starting
-- price and a cover photo is Featured free for six months, once.
--
-- "Once" needs somewhere durable to live. Reading it back from the listing
-- (tier / featured_until) is not enough:
--   * downgrade_expired_featured() (0002) resets an expired listing to
--     tier = 'basic', featured_until = null. After that the row looks like it
--     never had Featured, and the offer would be handed out again every six
--     months, forever.
--   * "vendors manage their own record" and "vendor owners manage their
--     listings" are FOR ALL, so a vendor can delete a listing and add it again.
--
-- So the grant is recorded on the ACCOUNT, in profiles.founding_granted_at.
-- profiles is the one table API users cannot write freely: 0009 revoked UPDATE
-- and re-granted it for (display_name, avatar_url) only, and there is no
-- INSERT or DELETE policy. A new column is therefore read-only to every
-- signed-in user without any further work, and it survives the vendor or the
-- listing being deleted and recreated.
--
-- The grant itself moves into one SECURITY DEFINER function so the eligibility
-- check, the listing update and the marker are a single transaction: two
-- requests cannot both grant, and a failure halfway cannot leave a listing
-- Featured with no record of it (or a record with no Featured listing).
--
-- Only the service role may call it. The app calls it from
-- src/lib/founding.ts after a claim, an approval, or a listing edit.
-- ----------------------------------------------------------------------------

begin;

alter table public.profiles
  add column if not exists founding_granted_at timestamptz;

comment on column public.profiles.founding_granted_at is
  'When this account was given the founding-vendor offer (Featured free for six months). Set once by grant_founding_vendor(); never cleared. See migration 0018.';

create or replace function public.grant_founding_vendor(p_vendor_id uuid, p_months int default 6)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner   uuid;
  v_granted timestamptz;
  v_until   timestamptz := now() + make_interval(months => p_months);
  v_rows    int;
begin
  if p_months is null or p_months < 1 or p_months > 24 then
    return null;
  end if;

  select user_id into v_owner from public.vendors where id = p_vendor_id;
  -- Unknown vendor, or a seeded profile nobody has claimed: the offer is the
  -- reward for taking ownership.
  if v_owner is null then
    return null;
  end if;

  -- Serialize on the account, so two calls (two tabs, a double click, the
  -- claim and the listing save landing together) run one after the other.
  select founding_granted_at into v_granted
    from public.profiles where id = v_owner for update;
  if not found or v_granted is not null then
    return null;
  end if;

  -- A paying or formerly paying customer is not offered the free period, on
  -- this vendor or any other vendor the same account owns.
  if exists (
    select 1
      from public.subscriptions s
      join public.vendors v on v.id = s.vendor_id
     where v.user_id = v_owner
  ) then
    return null;
  end if;

  -- A listing that is or was Featured without a marker (comped by hand, or
  -- from before this migration) also means "not again".
  if exists (
    select 1 from public.listings
     where vendor_id = p_vendor_id
       and (tier = 'featured' or featured_until is not null)
  ) then
    return null;
  end if;

  update public.listings
     set tier = 'featured', featured_until = v_until
   where vendor_id = p_vendor_id
     and status = 'approved'
     and tier = 'basic'
     and featured_until is null
     and starting_price_cents is not null
     and coalesce(hero_image_url, '') <> '';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return null;                      -- nothing qualifies yet
  end if;

  update public.profiles set founding_granted_at = now() where id = v_owner;
  return v_until;
end;
$$;

comment on function public.grant_founding_vendor(uuid, int) is
  'Applies the founding-vendor offer to a vendor if it qualifies, exactly once per account. Returns the end of the free period, or null when nothing was granted. Service role only. See migration 0018.';

revoke all on function public.grant_founding_vendor(uuid, int) from public;
revoke all on function public.grant_founding_vendor(uuid, int) from anon, authenticated;
grant execute on function public.grant_founding_vendor(uuid, int) to service_role;

commit;

-- Make the REST layer see the new column and function straight away. Without
-- this the app can read the offer (the column) before it can grant it (the
-- function), and a vendor is shown a button that does nothing.
notify pgrst, 'reload schema';
