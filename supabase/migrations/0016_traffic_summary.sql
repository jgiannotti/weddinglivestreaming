-- 0016_traffic_summary.sql
--
-- One round trip for the whole /admin/traffic dashboard.
--
-- The alternative was pulling raw page_views rows into the server component and
-- grouping them in JavaScript. That works today at ~100 rows/week and quietly
-- breaks later: PostgREST caps responses at 1000 rows by default, so the first
-- busy month would silently truncate the data and understate every number on
-- the page — the worst possible failure mode for a traffic dashboard. Doing the
-- aggregation in Postgres has no such ceiling.
--
-- Returns one json object with the current window, the window immediately
-- before it (so the page can show real deltas rather than a bare number), and
-- the breakdowns.
--
-- Called only with the service-role key from a requireAdmin()-gated server
-- component, so it needs no SECURITY DEFINER and no grants: nothing else can
-- reach page_views to begin with (0015 leaves RLS on with zero policies).

create or replace function public.traffic_summary(p_days int default 28)
returns json
language sql
stable
as $$
with b as (
  select
    ((now() at time zone 'utc')::date - (p_days - 1))     as cur_start,
    ((now() at time zone 'utc')::date)                    as cur_end,
    ((now() at time zone 'utc')::date - (p_days * 2 - 1)) as prev_start,
    ((now() at time zone 'utc')::date - p_days)           as prev_end
),
-- Humans only. Bot rows stay in the table (they're the AI-crawler signal) but
-- must never touch the visitor/pageview headline, or a crawl spike would read
-- as an audience spike.
cur as (
  select * from page_views, b
   where not is_bot and day between b.cur_start and b.cur_end
),
prev as (
  select * from page_views, b
   where not is_bot and day between b.prev_start and b.prev_end
),
crawl_cur as (
  select * from page_views, b
   where ai_crawler is not null and day between b.cur_start and b.cur_end
),
crawl_prev as (
  select * from page_views, b
   where ai_crawler is not null and day between b.prev_start and b.prev_end
)
select json_build_object(
  'days', p_days,
  'range', (select json_build_object('start', cur_start, 'end', cur_end) from b),

  'current', json_build_object(
    'visitors',  (select count(distinct visitor_hash) from cur),
    'views',     (select count(*) from cur),
    'crawls',    (select count(*) from crawl_cur),
    -- Clicks that arrived from an AI assistant: the single number that says
    -- whether the AEO work is producing humans rather than just impressions.
    'ai_clicks', (select count(*) from cur where source = 'ai_assistant')
  ),
  'previous', json_build_object(
    'visitors',  (select count(distinct visitor_hash) from prev),
    'views',     (select count(*) from prev),
    'crawls',    (select count(*) from crawl_prev),
    'ai_clicks', (select count(*) from prev where source = 'ai_assistant')
  ),

  -- Dense daily series: generate_series drives it so days with no traffic come
  -- back as explicit zeros. A chart that just omits empty days misreads a dead
  -- week as a flat line.
  'daily', (
    select coalesce(json_agg(x order by x.day), '[]'::json) from (
      select d::date as day,
             (select count(distinct visitor_hash) from cur where cur.day = d::date) as visitors,
             (select count(*) from cur where cur.day = d::date)                     as views,
             (select count(*) from crawl_cur where crawl_cur.day = d::date)         as crawls
        from b, generate_series(b.cur_start, b.cur_end, interval '1 day') d
    ) x
  ),

  'sources', (
    select coalesce(json_agg(x order by x.views desc), '[]'::json) from (
      select source, count(*) as views, count(distinct visitor_hash) as visitors
        from cur group by source
    ) x
  ),

  'pages', (
    select coalesce(json_agg(x order by x.views desc), '[]'::json) from (
      select path, count(*) as views, count(distinct visitor_hash) as visitors
        from cur group by path order by count(*) desc limit 12
    ) x
  ),

  'referrers', (
    select coalesce(json_agg(x order by x.views desc), '[]'::json) from (
      select referrer_host, source, count(*) as views
        from cur where referrer_host is not null
       group by referrer_host, source order by count(*) desc limit 12
    ) x
  ),

  'crawlers', (
    select coalesce(json_agg(x order by x.hits desc), '[]'::json) from (
      select ai_crawler, count(*) as hits, max(occurred_at) as last_seen
        from crawl_cur group by ai_crawler order by count(*) desc
    ) x
  ),

  'devices', (
    select coalesce(json_agg(x order by x.visitors desc), '[]'::json) from (
      select device, count(distinct visitor_hash) as visitors
        from cur where device is not null group by device
    ) x
  ),

  'countries', (
    select coalesce(json_agg(x order by x.visitors desc), '[]'::json) from (
      select country, count(distinct visitor_hash) as visitors
        from cur where country is not null
       group by country order by count(distinct visitor_hash) desc limit 8
    ) x
  )
);
$$;

comment on function public.traffic_summary(int) is
  'Everything /admin/traffic needs, in one call. Current window vs the preceding window of equal length. Bots excluded from visitor/view counts; AI crawlers reported separately.';
