-- 0012: Private contact info for seeded/unclaimed vendors.
--
-- Purpose: when a couple submits a quote request that matches an UNCLAIMED
-- vendor, we notify that vendor at the public email we recorded during
-- seeding, with a "claim your profile to respond" CTA (the supply-side
-- growth loop). These addresses must never be exposed through the public
-- API, so they live in their own table with RLS on and no policies —
-- only the service-role key (server routes) can read or write it.
--
-- last_lead_notified_at throttles notifications (max one per 7 days per
-- vendor) and opt_out honors unsubscribe requests.

create table if not exists public.vendor_private_contacts (
  vendor_id             uuid primary key references public.vendors(id) on delete cascade,
  public_email          text,
  public_phone          text,
  contact_form_url      text,
  source                text not null default 'seed-scrape',
  opt_out               boolean not null default false,
  last_lead_notified_at timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.vendor_private_contacts enable row level security;

-- No policies on purpose: anon/authenticated get nothing, service role
-- bypasses RLS. Belt-and-suspenders: revoke table grants too.
revoke all on table public.vendor_private_contacts from anon, authenticated;
