-- ============================================================================
-- Phase 6 monetization: lead-gen flow + couple-side email capture
-- ============================================================================

create type lead_status as enum ('new', 'sent', 'converted');

-- ----------------------------------------------------------------------------
-- LEADS — "Get Free Quotes" form submissions (listing/state/city pages)
-- ----------------------------------------------------------------------------
create table public.leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  phone               text,
  wedding_date        date,
  venue_city          text,
  venue_state         text,
  guest_count         int,
  budget              text,
  message             text,
  source_listing_id   uuid references public.listings(id) on delete set null,
  -- Denormalized: which vendors this lead was matched/sent to, in priority
  -- order (Featured vendors first). Avoids a join table for v1 — still
  -- queryable via unnest() for the admin panel later.
  matched_vendor_ids  uuid[] not null default '{}',
  status              lead_status not null default 'new',
  created_at          timestamptz not null default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_source_listing on public.leads(source_listing_id);
create index idx_leads_venue_state on public.leads(venue_state);

alter table public.leads enable row level security;

-- Anyone (including anonymous couples) can submit a lead. No public SELECT —
-- a couple's name/email/phone must never be listable by anonymous queries.
create policy "anyone can submit a lead"
  on public.leads for insert
  with check (true);

-- A vendor can see leads that were matched to them.
create policy "vendors see leads matched to them"
  on public.leads for select
  using (
    exists (
      select 1 from public.vendors v
      where v.user_id = auth.uid()
        and v.id = any (matched_vendor_ids)
    )
  );

create policy "admins manage all leads"
  on public.leads for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ----------------------------------------------------------------------------
-- SUBSCRIBERS — couple-side email capture (planning tips opt-in)
-- ----------------------------------------------------------------------------
create table public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Insert-only, no public SELECT — prevents the email list from being scraped
-- through the anon key.
create policy "anyone can subscribe"
  on public.subscribers for insert
  with check (true);

create policy "admins manage all subscribers"
  on public.subscribers for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
