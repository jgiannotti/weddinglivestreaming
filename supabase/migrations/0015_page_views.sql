-- 0015_page_views.sql
--
-- First-party traffic tracking.
--
-- Why this exists when Vercel Web Analytics is already on: Vercel's numbers are
-- client-side JavaScript, so they only ever describe humans with a browser, and
-- they can't be queried from outside the dashboard. The thing we actually need
-- to watch after the SEO/AEO work is the half Vercel is structurally blind to —
-- GPTBot, PerplexityBot, ClaudeBot and friends crawling the guides. An AI
-- crawler never runs JS, so it never appears in Vercel. It does appear here.
--
-- Privacy posture: no IP address and no cookie is ever stored. visitor_hash is
-- a truncated SHA-256 of (ip + user-agent + UTC date + secret salt). Because
-- the date is in the digest, the hash rotates every midnight and cannot be used
-- to follow someone across days; because the salt is server-side only, it can't
-- be reversed or recomputed by anyone holding the table. This is the same
-- construction Plausible and Fathom use, and it's what keeps the site out of
-- cookie-banner territory.

create table if not exists public.page_views (
  id            bigserial primary key,
  occurred_at   timestamptz not null default now(),
  day           date        not null default (now() at time zone 'utc')::date,

  path          text not null,

  -- Null for bots and AI crawlers: counting "unique crawlers" is meaningless
  -- and would only pollute the visitor number on the dashboard.
  visitor_hash  text,

  referrer_host text,

  -- direct | organic | ai_assistant | social | referral | internal
  -- ai_assistant is the payoff column: a click arriving from chatgpt.com or
  -- perplexity.ai is the AEO work converting, and no other tool we have
  -- separates it from ordinary "referral" noise.
  source        text not null default 'direct',

  utm_source    text,
  utm_medium    text,
  utm_campaign  text,

  country       text,
  device        text,

  is_bot        boolean not null default false,

  -- The crawler's own name ('GPTBot', 'PerplexityBot', ...) when one is
  -- recognized, null otherwise. Kept as text rather than a boolean so we can
  -- see *which* engines are indexing us and how often.
  ai_crawler    text
);

-- Every dashboard query is "recent rows, grouped by something", so day leads
-- each index. The partial index on ai_crawler stays tiny because the column is
-- null for the overwhelming majority of rows.
create index if not exists page_views_day_idx        on public.page_views (day desc);
create index if not exists page_views_day_source_idx on public.page_views (day desc, source);
create index if not exists page_views_day_path_idx   on public.page_views (day desc, path);
create index if not exists page_views_ai_crawler_idx on public.page_views (day desc, ai_crawler)
  where ai_crawler is not null;

-- RLS on with deliberately zero policies. Nothing reaches this table except the
-- service-role key, which bypasses RLS: the middleware writes with it and the
-- admin dashboard reads with it behind requireAdmin(). A signed-in vendor or an
-- anonymous visitor gets an empty set, not a partial one.
alter table public.page_views enable row level security;

comment on table public.page_views is
  'First-party pageview log. No IP, no cookies. visitor_hash rotates daily. Service-role access only.';
