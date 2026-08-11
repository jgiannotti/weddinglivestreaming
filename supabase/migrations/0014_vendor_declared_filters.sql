-- ============================================================================
-- 0014_vendor_declared_filters.sql
--
-- Retires the category system and replaces it with two vendor-declared facts.
--
-- Why: the six categories (Budget-Friendly, Church & Religious Ceremonies,
-- Destination Weddings, Full-Service Production, Multi-Camera & Cinematic,
-- Solo Operator) were never chosen by a vendor. All 245 listing_categories
-- rows were assigned by our own seed imports, and the distribution proved it:
-- 94 of 195 listings in one bucket, 2 in another. A filter that returns half
-- the directory or two results is not a filter, and none of it was verified.
--
-- What replaces it: starting_price_cents and crew_type, both nullable, both
-- filled in by the vendor on their own listing. They start empty on every
-- existing row — nothing is backfilled, and in particular no scraped pricing
-- is imported (the seed data's starting_price figures were unreliable; one
-- "vendor price" of $50 turned out to be a per-hour add-on). The directory
-- hides each filter until at least one vendor has supplied that value, so an
-- empty facet never renders as a dead control.
--
-- No public URLs are lost: categories had no /category/[slug] pages, only a
-- ?category= query param on /directory, which canonicals to /directory.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- NEW COLUMNS
-- ----------------------------------------------------------------------------

alter table public.listings
  add column if not exists starting_price_cents integer,
  add column if not exists crew_type text;

comment on column public.listings.starting_price_cents is
  'Vendor-declared "packages start at" price, in cents. NULL = not supplied. Never populated from scraped data.';
comment on column public.listings.crew_type is
  'Vendor-declared crew size: solo (one operator, single camera), duo (two-person, multi-camera), crew (three or more). NULL = not supplied.';

-- Sanity bounds rather than trust: $50 to $50,000. Blocks a vendor typing
-- dollars into a cents field (or a stray extra zero) from rendering as
-- "From $120,000" on a public page.
alter table public.listings
  drop constraint if exists listings_starting_price_sane;
alter table public.listings
  add constraint listings_starting_price_sane
  check (
    starting_price_cents is null
    or (starting_price_cents >= 5000 and starting_price_cents <= 5000000)
  );

alter table public.listings
  drop constraint if exists listings_crew_type_valid;
alter table public.listings
  add constraint listings_crew_type_valid
  check (crew_type is null or crew_type in ('solo', 'duo', 'crew'));

-- Partial indexes: the overwhelming majority of rows are NULL on both columns
-- today, and only the non-NULL ones are ever filtered or sorted on.
create index if not exists idx_listings_starting_price
  on public.listings (starting_price_cents)
  where starting_price_cents is not null;

create index if not exists idx_listings_crew_type
  on public.listings (crew_type)
  where crew_type is not null;

-- ----------------------------------------------------------------------------
-- RADIUS SEARCH RPC — swap the category_slug argument for price/crew
--
-- The old signature took category_slug and EXISTS-joined listing_categories.
-- Both go away. Dropped explicitly first because the argument list changes,
-- and CREATE OR REPLACE cannot change a function's signature.
--
-- Semantics of the new filters: a listing with no declared price cannot match
-- a price filter, and a listing with no declared crew_type cannot match a crew
-- filter. Filtering to "under $1,000" returns only vendors known to be under
-- $1,000 — never "everyone we have no data for."
-- ----------------------------------------------------------------------------

drop function if exists public.search_listings_by_location(
  double precision, double precision, text, text, int
);

create or replace function public.search_listings_by_location(
  search_lat double precision,
  search_lng double precision,
  search_state text default null,
  min_price_cents int default null,
  max_price_cents int default null,
  crew_filter text default null,
  result_limit int default 60
)
returns table (
  listing_id uuid,
  distance_miles double precision,
  search_tier int,
  is_featured boolean
)
language sql
stable
as $$
  with candidates as (
    select
      l.id,
      earth_distance(ll_to_earth(search_lat, search_lng), ll_to_earth(l.lat, l.lng)) / 1609.344 as distance_miles,
      l.service_radius_miles,
      l.travels_nationwide,
      l.state,
      (l.tier = 'featured' and (l.featured_until is null or l.featured_until > now())) as is_featured
    from public.listings l
    where l.status = 'approved'
      and l.expires_at > now()
      and l.lat is not null
      and l.lng is not null
      and (min_price_cents is null or l.starting_price_cents >= min_price_cents)
      and (max_price_cents is null or l.starting_price_cents <= max_price_cents)
      and (crew_filter is null or l.crew_type = crew_filter)
  ),
  tier1 as (
    select id, distance_miles, 1 as search_tier, is_featured
    from candidates
    where distance_miles <= service_radius_miles
  ),
  tier2 as (
    select id, distance_miles, 2 as search_tier, is_featured
    from candidates
    where search_state is not null
      and lower(state) = lower(search_state)
      and distance_miles > service_radius_miles
      and id not in (select id from tier1)
  ),
  tier3 as (
    select id, distance_miles, 3 as search_tier, is_featured
    from candidates
    where travels_nationwide = true
      and id not in (select id from tier1)
      and id not in (select id from tier2)
  ),
  combined as (
    select * from tier1
    union all
    select * from tier2
    union all
    select * from tier3
  )
  select id as listing_id, distance_miles, search_tier, is_featured
  from combined
  order by search_tier asc, is_featured desc, distance_miles asc
  limit result_limit;
$$;

grant execute on function public.search_listings_by_location(
  double precision, double precision, text, int, int, text, int
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- FACET AVAILABILITY — drives "hide the filter until a vendor has filled it in"
--
-- One cheap call instead of two count queries from the directory page, and it
-- keeps the "is this facet worth rendering?" rule in one place.
-- ----------------------------------------------------------------------------

create or replace function public.listing_filter_facets()
returns table (
  priced_count bigint,
  crew_count bigint
)
language sql
stable
as $$
  select
    count(*) filter (where starting_price_cents is not null) as priced_count,
    count(*) filter (where crew_type is not null) as crew_count
  from public.listings
  where status = 'approved'
    and expires_at > now();
$$;

grant execute on function public.listing_filter_facets() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- DROP THE CATEGORY SYSTEM
--
-- Policies and indexes go with the tables. listing_categories first (it holds
-- the FK to categories).
-- ----------------------------------------------------------------------------

drop table if exists public.listing_categories;
drop table if exists public.categories;
