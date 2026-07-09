-- ============================================================================
-- Milestone 2 — Location intelligence & tiered radius search
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent-ish:
-- uses IF NOT EXISTS / OR REPLACE everywhere so it's safe to re-run.
--
-- Data source for cities/zips: GeoNames (https://www.geonames.org), licensed
-- CC BY 4.0 — attribution: "Contains information from GeoNames, which is made
-- available under the Creative Commons Attribution 4.0 International License."
-- Seed data loaded separately via REST bulk-insert (see migration/seed-cities.py),
-- not inline here — it's ~17k + ~41k rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CITIES — stored coordinates backbone (own DB, no live geocoding API calls
-- for storage — Mapbox's free geocoding tier forbids persisting results).
-- ----------------------------------------------------------------------------
create table if not exists public.cities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  state_code    text not null,
  lat           double precision not null,
  lng           double precision not null,
  population    int not null default 0,
  slug          text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists idx_cities_name_state on public.cities (lower(name), state_code);
create index if not exists idx_cities_location on public.cities using gist (ll_to_earth(lat, lng));
create index if not exists idx_cities_slug on public.cities (slug);
create index if not exists idx_cities_state on public.cities (state_code);
-- Prefix search for type-ahead (ILIKE 'foo%' can use this with text_pattern_ops).
create index if not exists idx_cities_name_prefix on public.cities (lower(name) text_pattern_ops);
create index if not exists idx_cities_population on public.cities (population desc);

alter table public.cities enable row level security;
drop policy if exists "cities are publicly readable" on public.cities;
create policy "cities are publicly readable" on public.cities for select using (true);
-- No insert/update/delete policy for anon/authenticated -> writes only via service role.

-- ----------------------------------------------------------------------------
-- ZIPS — ZIP-code lookup so "33701" style searches resolve to coordinates.
-- ----------------------------------------------------------------------------
create table if not exists public.zips (
  zip         text primary key,
  city        text not null,
  state_code  text not null,
  lat         double precision not null,
  lng         double precision not null
);

create index if not exists idx_zips_location on public.zips using gist (ll_to_earth(lat, lng));

alter table public.zips enable row level security;
drop policy if exists "zips are publicly readable" on public.zips;
create policy "zips are publicly readable" on public.zips for select using (true);

-- ----------------------------------------------------------------------------
-- LISTINGS — coverage radius
-- ----------------------------------------------------------------------------
alter table public.listings
  add column if not exists service_radius_miles int not null default 60,
  add column if not exists travels_nationwide boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_service_radius_bounds'
  ) then
    alter table public.listings
      add constraint listings_service_radius_bounds
      check (service_radius_miles between 10 and 500);
  end if;
end $$;

create index if not exists idx_listings_nationwide on public.listings (travels_nationwide) where travels_nationwide = true;

-- ----------------------------------------------------------------------------
-- TIERED RADIUS SEARCH — replaces ilike city/state string matching.
--
-- Tier 1: listing's own coverage circle includes the search point (the
--         vendor covers the couple) — the actual bug fix (St. Pete search
--         now finds a Tampa vendor whose radius reaches St. Pete).
-- Tier 2: same state, beyond the vendor's radius (fallback when tier 1 is
--         thin — the app layer decides the <5 display threshold).
-- Tier 3: travels_nationwide vendors, always available as a last resort.
--
-- Ranks by tier, then currently-effective Featured status (query-time
-- expiry check, consistent with effectiveTier() in src/lib/data/listings.ts),
-- then distance.
-- ----------------------------------------------------------------------------
create or replace function public.search_listings_by_location(
  search_lat double precision,
  search_lng double precision,
  search_state text default null,
  category_slug text default null,
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
      and (
        category_slug is null
        or exists (
          select 1
          from public.listing_categories lc
          join public.categories c on c.id = lc.category_id
          where lc.listing_id = l.id and c.slug = category_slug
        )
      )
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

grant execute on function public.search_listings_by_location(double precision, double precision, text, text, int) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- CITY/ZIP TYPE-AHEAD LOOKUP — prefix search ranked by population.
-- Wrapped as a function (not raw table access) so the API route has one
-- rate-limitable, cacheable call and the sort/limit logic lives in one place.
-- ----------------------------------------------------------------------------
create or replace function public.suggest_cities(
  prefix text,
  result_limit int default 8
)
returns table (
  name text,
  state_code text,
  lat double precision,
  lng double precision,
  population int
)
language sql
stable
as $$
  select c.name, c.state_code, c.lat, c.lng, c.population
  from public.cities c
  where lower(c.name) like lower(prefix) || '%'
  order by c.population desc
  limit result_limit;
$$;

grant execute on function public.suggest_cities(text, int) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- NEAREST CITY — backs the "Near me" button (browser geolocation -> nearest
-- own-DB city -> radius search). Replaces a Nominatim reverse-geocode call
-- with an own-DB lookup (one less third party, no rate limits to worry about).
-- ----------------------------------------------------------------------------
create or replace function public.nearest_city(
  search_lat double precision,
  search_lng double precision
)
returns table (
  name text,
  state_code text,
  lat double precision,
  lng double precision,
  distance_miles double precision
)
language sql
stable
as $$
  select
    c.name,
    c.state_code,
    c.lat,
    c.lng,
    earth_distance(ll_to_earth(search_lat, search_lng), ll_to_earth(c.lat, c.lng)) / 1609.344 as distance_miles
  from public.cities c
  order by ll_to_earth(c.lat, c.lng) <-> ll_to_earth(search_lat, search_lng)
  limit 1;
$$;

grant execute on function public.nearest_city(double precision, double precision) to anon, authenticated;
