-- ----------------------------------------------------------------------------
-- 0017 — vendors cannot set their own tier, approval status, or counters
--
-- "vendor owners manage their listings" (0006) is FOR ALL with no column
-- restriction, and `authenticated` holds table-wide INSERT/UPDATE on listings.
-- So any signed-in vendor, with nothing but the public anon key and their own
-- session, could run
--
--     update listings
--        set tier = 'featured', featured_until = null, status = 'approved'
--      where id = '<their own listing>';
--
-- and have a Featured listing for free, forever, without ever passing the
-- review queue. A new listing could be inserted already approved the same way.
-- It is the same class of hole 0009 closed for profiles.role, on the table
-- that carries the paid product.
--
-- Fix: a BEFORE trigger that pins the columns only the platform may set
-- whenever the writer is an ordinary API user. Everything else passes through
-- untouched:
--   service_role  server routes, Stripe webhook, founding-vendor grants, imports
--   postgres etc. migrations, SQL editor, Management API, the health check's
--                 setup and cleanup
--   admins        the /admin approval queue (role authenticated + is_admin())
--
-- A trigger rather than column-level grants (0009's approach for profiles)
-- because the vendor forms send whole-row inserts and updates; revoking
-- columns would make those calls fail outright. Pinning keeps every existing
-- client call working exactly as it does today, and simply ignores the values
-- a vendor has no business sending.
--
-- Pinned on INSERT: status, tier, featured_until, view_count, inquiry_count,
--                   expires_at (to the "never expires" value set in 2026-08).
-- Pinned on UPDATE: the same, plus vendor_id and slug (a listing cannot be
--                   moved to another vendor or have its public URL changed
--                   from the browser).
-- ----------------------------------------------------------------------------

begin;

-- Listings do not expire (pricing cleanup, 2026-08-14). That change was made
-- directly in production and never written down as a migration, so a database
-- rebuilt from this folder still defaulted to "now + 12 months". Recorded here
-- so the folder matches production; a no-op where it is already in place.
alter table public.listings
  alter column expires_at set default timestamptz '2100-01-01 00:00:00+00';

create or replace function public.listings_pin_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- SECURITY INVOKER on purpose: current_user must be the role PostgREST
  -- switched to for this request, not the function owner.
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status         := 'pending';
    new.tier           := 'basic';
    new.featured_until := null;
    new.view_count     := 0;
    new.inquiry_count  := 0;
    new.expires_at     := timestamptz '2100-01-01 00:00:00+00';
  else
    new.status         := old.status;
    new.tier           := old.tier;
    new.featured_until := old.featured_until;
    new.view_count     := old.view_count;
    new.inquiry_count  := old.inquiry_count;
    new.expires_at     := old.expires_at;
    new.vendor_id      := old.vendor_id;
    new.slug           := old.slug;
  end if;

  return new;
end;
$$;

comment on function public.listings_pin_privileged_columns() is
  'Keeps vendors from changing their own tier, approval status, counters, expiry, owner or slug. Service role, admins and direct SQL are unaffected. See migration 0017.';

drop trigger if exists listings_pin_privileged_columns on public.listings;
create trigger listings_pin_privileged_columns
  before insert or update on public.listings
  for each row execute function public.listings_pin_privileged_columns();

commit;
