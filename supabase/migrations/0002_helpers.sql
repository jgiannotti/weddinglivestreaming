-- ============================================================================
-- Helpful RPC functions
-- ============================================================================

-- Atomic inquiry counter increment (called when a message is sent)
create or replace function increment_inquiry_count(listing_id uuid)
returns void as $$
  update public.listings set inquiry_count = inquiry_count + 1 where id = listing_id;
$$ language sql;

-- Atomic view counter increment (called from /listing/[slug] page server-side)
create or replace function increment_view_count(listing_id uuid)
returns void as $$
  update public.listings set view_count = view_count + 1 where id = listing_id;
$$ language sql;

-- Expire featured listings whose featured_until has passed
-- Run nightly via Supabase cron or Vercel cron
create or replace function downgrade_expired_featured()
returns int as $$
  with updated as (
    update public.listings
       set tier = 'basic', featured_until = null
     where tier = 'featured'
       and featured_until is not null
       and featured_until < now()
    returning id
  )
  select count(*)::int from updated;
$$ language sql;
