-- ============================================================================
-- WeddingLiveStreaming.com — initial schema
-- Targets Supabase (Postgres 15+). Run with `supabase db push` or via SQL editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role          as enum ('couple', 'vendor', 'admin');
create type listing_status     as enum ('pending', 'approved', 'rejected');
create type listing_tier       as enum ('basic', 'featured');
create type subscription_plan  as enum ('monthly', 'annual');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'incomplete');
create type payment_processor  as enum ('stripe', 'paypal');
create type claim_status       as enum ('pending', 'approved', 'rejected');
create type report_status      as enum ('new', 'reviewed', 'dismissed');

-- ----------------------------------------------------------------------------
-- USERS — extends Supabase auth.users with app-specific fields
-- ----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  role          user_role not null default 'couple',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);

-- ----------------------------------------------------------------------------
-- VENDORS — one per business
-- ----------------------------------------------------------------------------
create table public.vendors (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  business_name  text not null,
  slug           text not null unique,
  bio            text,
  website_url    text,
  phone          text,
  member_since   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_vendors_user_id on public.vendors(user_id);
create index idx_vendors_slug on public.vendors(slug);

-- ----------------------------------------------------------------------------
-- CATEGORIES — seeded with the existing 6 HivePress categories
-- ----------------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

insert into public.categories (name, slug, sort_order) values
  ('Budget-Friendly',                'budget-friendly',           1),
  ('Church & Religious Ceremonies',  'church-religious',          2),
  ('Destination Weddings',           'destination-weddings',      3),
  ('Full-Service Production',        'full-service-production',   4),
  ('Multi-Camera & Cinematic',       'multi-camera-cinematic',    5),
  ('Solo Operator',                  'solo-operator',             6);

-- ----------------------------------------------------------------------------
-- LISTINGS
-- ----------------------------------------------------------------------------
create table public.listings (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  title           text not null,
  slug            text not null unique,
  description     text not null,
  hero_image_url  text,
  website_url     text,
  city            text not null,
  state           text not null,
  country         text not null default 'United States',
  lat             double precision,
  lng             double precision,
  status          listing_status not null default 'pending',
  tier            listing_tier not null default 'basic',
  featured_until  timestamptz,
  view_count      int not null default 0,
  inquiry_count   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '12 months')
);

create index idx_listings_vendor_id on public.listings(vendor_id);
create index idx_listings_slug on public.listings(slug);
create index idx_listings_status on public.listings(status);
create index idx_listings_state on public.listings(state);
create index idx_listings_tier_status on public.listings(tier, status);
create index idx_listings_location on public.listings using gist (
  ll_to_earth(lat, lng)
);

-- Full-text search index for title + description + city
create index idx_listings_search on public.listings using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, ''))
);

-- ----------------------------------------------------------------------------
-- LISTING_CATEGORIES (many-to-many)
-- ----------------------------------------------------------------------------
create table public.listing_categories (
  listing_id    uuid not null references public.listings(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  primary key (listing_id, category_id)
);

create index idx_listing_categories_category on public.listing_categories(category_id);

-- ----------------------------------------------------------------------------
-- LISTING_PHOTOS (gallery)
-- ----------------------------------------------------------------------------
create table public.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  url          text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index idx_listing_photos_listing on public.listing_photos(listing_id);

-- ----------------------------------------------------------------------------
-- MESSAGES — couples → vendors
-- ----------------------------------------------------------------------------
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  from_user_id    uuid not null references public.profiles(id) on delete cascade,
  to_vendor_id    uuid not null references public.vendors(id) on delete cascade,
  listing_id      uuid references public.listings(id) on delete set null,
  subject         text,
  body            text not null,
  sender_email    text not null,
  sender_name     text,
  sender_phone    text,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_messages_to_vendor on public.messages(to_vendor_id);
create index idx_messages_from_user on public.messages(from_user_id);

-- ----------------------------------------------------------------------------
-- FAVORITES
-- ----------------------------------------------------------------------------
create table public.favorites (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  listing_id   uuid not null references public.listings(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ----------------------------------------------------------------------------
-- CLAIMS — "I own this listing"
-- ----------------------------------------------------------------------------
create table public.claim_requests (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  details      text not null,
  status       claim_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- REPORTS — moderation
-- ----------------------------------------------------------------------------
create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         uuid not null references public.listings(id) on delete cascade,
  reporter_user_id   uuid references public.profiles(id) on delete set null,
  reason             text not null,
  details            text,
  status             report_status not null default 'new',
  created_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS — backs Featured tier (Stripe or PayPal)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  vendor_id            uuid not null references public.vendors(id) on delete cascade,
  processor            payment_processor not null,
  external_customer_id text,
  external_id          text not null,
  plan                 subscription_plan not null,
  status               subscription_status not null default 'incomplete',
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (processor, external_id)
);

create index idx_subscriptions_vendor on public.subscriptions(vendor_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- ----------------------------------------------------------------------------
-- TRIGGERS — keep updated_at fresh
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at      before update on public.profiles      for each row execute function set_updated_at();
create trigger trg_vendors_updated_at       before update on public.vendors       for each row execute function set_updated_at();
create trigger trg_listings_updated_at      before update on public.listings      for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.vendors             enable row level security;
alter table public.listings            enable row level security;
alter table public.listing_categories  enable row level security;
alter table public.listing_photos      enable row level security;
alter table public.messages            enable row level security;
alter table public.favorites           enable row level security;
alter table public.claim_requests      enable row level security;
alter table public.reports             enable row level security;
alter table public.subscriptions       enable row level security;

-- Public read access to approved listings
create policy "approved listings are public"
  on public.listings for select
  using (status = 'approved');

create policy "categories are public"
  on public.categories for select
  using (true);

create policy "approved listing categories are public"
  on public.listing_categories for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.status = 'approved'));

create policy "approved listing photos are public"
  on public.listing_photos for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.status = 'approved'));

create policy "vendors of approved listings are public"
  on public.vendors for select
  using (exists (select 1 from public.listings l where l.vendor_id = vendors.id and l.status = 'approved'));

-- Profiles: users can see their own
create policy "users see their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "users update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Vendors: owners can manage their own
create policy "vendors manage their own record"
  on public.vendors for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Listings: vendor owners full control
create policy "vendor owners manage their listings"
  on public.listings for all
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()))
  with check (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- Messages: visible to sender and recipient vendor's owner
create policy "messages visible to participants"
  on public.messages for select
  using (
    from_user_id = auth.uid()
    or to_vendor_id in (select id from public.vendors where user_id = auth.uid())
  );

create policy "anyone authenticated can send a message"
  on public.messages for insert
  with check (from_user_id = auth.uid());

-- Favorites: user-owned
create policy "favorites are user-owned"
  on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Subscriptions: vendor-owned
create policy "vendor subscriptions are owner-only"
  on public.subscriptions for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- Admin override (admins see all)
create policy "admins see all listings"           on public.listings           for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admins see all vendors"            on public.vendors            for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admins see all profiles"           on public.profiles           for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins see all messages"           on public.messages           for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admins see all claims"             on public.claim_requests     for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admins see all reports"            on public.reports            for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admins see all subscriptions"      on public.subscriptions      for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
