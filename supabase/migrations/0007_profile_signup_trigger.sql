-- ----------------------------------------------------------------------------
-- 0007 — profiles signup trigger + admin backfill
--
-- Found while fixing 0006: auth.users had 1 user (the admin) but profiles had
-- ZERO rows, and no trigger existed to create a profile on signup. The app
-- assumes profiles always exist:
--   * every /api/admin/* route checks profiles.role = 'admin'  -> admin was
--     locked out of his own admin panel
--   * submit-listing runs UPDATE profiles SET role='vendor'    -> silently
--     no-ops with no row, so new vendors never get the vendor role
--
-- Fix: standard Supabase handle_new_user() trigger + backfill for existing
-- auth users (making the sole existing user — Joe — an admin, matching the
-- original launch intent).
-- ----------------------------------------------------------------------------

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth users missing a profile
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- The site launched with exactly one account — the owner/admin.
update public.profiles
set role = 'admin'
where email = 'joe@floridasoundman.com';

commit;
