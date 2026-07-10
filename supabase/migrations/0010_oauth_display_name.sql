-- ----------------------------------------------------------------------------
-- 0010 — profile display names for OAuth signups
--
-- handle_new_user() (0007) only read raw_user_meta_data->>'display_name',
-- which our email signup form sets. OAuth providers (Google) set full_name /
-- name instead, so Google signups would get a NULL display_name. Coalesce
-- across the common keys.
-- ----------------------------------------------------------------------------

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

commit;
