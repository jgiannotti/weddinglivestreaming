import Link from 'next/link';
import { Bot, TrendingDown, TrendingUp, Minus, Sparkles } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { SOURCE_LABELS, type TrafficSource } from '@/lib/traffic';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Traffic' };

/**
 * First-party traffic dashboard.
 *
 * Reads with the service-role client because page_views has RLS on and zero
 * policies (0015) — the route is already gated by requireAdmin() in the admin
 * layout, so the authorization decision has been made before we get here.
 */

type Summary = {
  days: number;
  range: { start: string; end: string };
  current: { visitors: number; views: number; crawls: number; ai_clicks: number };
  previous: { visitors: number; views: number; crawls: number; ai_clicks: number };
  daily: { day: string; visitors: number; views: number; crawls: number }[];
  sources: { source: TrafficSource; views: number; visitors: number }[];
  pages: { path: string; views: number; visitors: number }[];
  referrers: { referrer_host: string; source: TrafficSource; views: number }[];
  crawlers: { ai_crawler: string; hits: number; last_seen: string }[];
  devices: { device: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
};

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 28, label: '28 days' },
  { days: 90, label: '90 days' },
];

function pctChange(now: number, before: number): number | null {
  // A jump from zero has no meaningful percentage. Returning null makes the UI
  // say "new" instead of printing an infinity or a fake +100%.
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
}

function Delta({ now, before }: { now: number; before: number }) {
  const pct = pctChange(now, before);
  if (pct === null) {
    return <span className="text-xs font-medium text-primary">new</span>;
  }
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="h-3 w-3" /> no change
      </span>
    );
  }
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        up ? 'text-emerald-600' : 'text-muted-foreground'
      }`}
    >
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}

/**
 * Bar chart drawn with plain divs. No charting dependency and no client-side
 * JavaScript — at this data volume a library would cost more bundle than the
 * chart is worth.
 */
function DailyChart({ daily }: { daily: Summary['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.visitors, d.crawls)));
  const showEvery = daily.length > 40 ? 14 : daily.length > 14 ? 7 : 1;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-display text-lg font-semibold">Daily activity</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-primary" /> Visitors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/40" /> AI crawler hits
          </span>
        </div>
      </div>

      <div className="flex items-end gap-[3px] h-40">
        {daily.map((d) => (
          <div
            key={d.day}
            className="flex-1 flex flex-col justify-end gap-[2px] group relative min-w-0"
            title={`${d.day} — ${d.visitors} visitor${d.visitors === 1 ? '' : 's'}, ${d.views} view${
              d.views === 1 ? '' : 's'
            }, ${d.crawls} AI crawler hit${d.crawls === 1 ? '' : 's'}`}
          >
            <div
              className="w-full rounded-sm bg-muted-foreground/30"
              style={{ height: `${(d.crawls / max) * 100}%` }}
            />
            <div
              className="w-full rounded-sm bg-primary"
              style={{ height: `${(d.visitors / max) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-[3px] mt-2">
        {daily.map((d, i) => (
          <div key={d.day} className="flex-1 min-w-0 text-[10px] text-muted-foreground text-center">
            {i % showEvery === 0 ? d.day.slice(5).replace('-', '/') : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({
  title,
  subtitle,
  rows,
  empty,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; value: number; hint?: string; highlight?: boolean }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 mb-3">{subtitle}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3">{empty}</p>
      ) : (
        <div className="space-y-1 mt-3">
          {rows.map((r) => (
            <div key={r.label} className="relative flex items-center justify-between rounded-md px-3 py-2 text-sm overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-md ${
                  r.highlight ? 'bg-primary/20' : 'bg-muted'
                }`}
                style={{ width: `${(r.value / max) * 100}%` }}
                aria-hidden
              />
              <span className="relative truncate pr-3">
                {r.label}
                {r.hint && <span className="text-muted-foreground text-xs ml-2">{r.hint}</span>}
              </span>
              <span className="relative font-medium tabular-nums">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Plain-English read of the numbers, so the page answers "is this good?" rather
 * than only "what is it?".
 */
function summarise(s: Summary): string[] {
  const notes: string[] = [];
  const { current: c, previous: p } = s;

  if (c.views === 0 && c.crawls === 0) {
    return [
      'No data yet for this window. Tracking starts collecting the moment the site is deployed — give it a day.',
    ];
  }

  const pct = pctChange(c.visitors, p.visitors);
  if (pct === null) {
    notes.push(`${c.visitors} visitors this period — the first traffic recorded in this window.`);
  } else if (pct > 0) {
    notes.push(
      `Visitors are up ${pct}% versus the previous ${s.days} days (${c.visitors} vs ${p.visitors}).`
    );
  } else if (pct < 0) {
    notes.push(
      `Visitors are down ${Math.abs(pct)}% versus the previous ${s.days} days (${c.visitors} vs ${p.visitors}).`
    );
  } else {
    notes.push(`Visitors are flat versus the previous ${s.days} days (${c.visitors}).`);
  }

  const organic = s.sources.find((x) => x.source === 'organic')?.visitors ?? 0;
  const totalVisitors = s.sources.reduce((a, b) => a + b.visitors, 0);
  if (organic > 0 && totalVisitors > 0) {
    notes.push(
      `${Math.round((organic / totalVisitors) * 100)}% of visitors came from a search engine — that's the SEO work showing up.`
    );
  }

  if (c.ai_clicks > 0) {
    notes.push(
      `${c.ai_clicks} visit${c.ai_clicks === 1 ? '' : 's'} came from an AI assistant (ChatGPT, Perplexity, Claude). That is the AEO work converting into actual people.`
    );
  } else if (c.crawls > 0) {
    notes.push(
      `AI engines crawled the site ${c.crawls} times but sent no clicks yet. Being indexed comes first; citations follow.`
    );
  } else {
    notes.push(
      'No AI crawler activity recorded yet. If this stays at zero for a couple of weeks, the llms.txt and schema work needs another look.'
    );
  }

  return notes;
}

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const parsed = Number(daysParam);
  const days = RANGES.some((r) => r.days === parsed) ? parsed : 28;

  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('traffic_summary', { p_days: days });
  const summary = data as Summary | null;

  if (error || !summary) {
    return (
      <div>
        <h1 className="font-display text-3xl font-medium mb-2">Traffic</h1>
        <p className="text-muted-foreground">
          Could not load traffic data{error ? `: ${error.message}` : ''}. If this is the first
          deploy since the tracking migration, confirm 0015/0016 ran.
        </p>
      </div>
    );
  }

  const { current: c, previous: p } = summary;
  const tiles = [
    { label: 'Visitors', value: c.visitors, before: p.visitors },
    { label: 'Page views', value: c.views, before: p.views },
    { label: 'From AI assistants', value: c.ai_clicks, before: p.ai_clicks, accent: true },
    { label: 'AI crawler hits', value: c.crawls, before: p.crawls, accent: true },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-1">Traffic</h1>
          <p className="text-muted-foreground text-sm">
            {summary.range.start} to {summary.range.end}, compared with the {days} days before it.
          </p>
        </div>
        <div className="flex rounded-lg border overflow-hidden text-sm shrink-0">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/traffic?days=${r.days}`}
              className={`px-3 py-1.5 font-medium transition-colors ${
                r.days === days
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-accent/40 p-4 my-6 text-sm space-y-1.5">
        {summarise(summary).map((line) => (
          <p key={line} className="m-0">
            {line}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-xl border p-5 ${t.accent ? 'bg-accent' : 'bg-card'}`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.label}</p>
            <p className="font-display text-3xl font-semibold leading-tight">{t.value}</p>
            <Delta now={t.value} before={t.before} />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <DailyChart daily={summary.daily} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarList
            title="Where visitors came from"
            subtitle="AI assistants are broken out separately from ordinary referrals."
            empty="No visits recorded in this window."
            rows={summary.sources.map((s) => ({
              label: SOURCE_LABELS[s.source] ?? s.source,
              value: s.visitors,
              hint: `${s.views} views`,
              highlight: s.source === 'ai_assistant',
            }))}
          />

          <BarList
            title="Most-read pages"
            empty="No page views recorded in this window."
            rows={summary.pages.map((x) => ({
              label: x.path,
              value: x.views,
              hint: `${x.visitors} visitors`,
            }))}
          />

          <BarList
            title="Referring sites"
            subtitle="Where the click physically came from."
            empty="No referrers yet — all traffic so far is direct."
            rows={summary.referrers.map((x) => ({
              label: x.referrer_host,
              value: x.views,
              highlight: x.source === 'ai_assistant',
            }))}
          />

          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4" /> AI engines crawling the site
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              These never run JavaScript, so Vercel Analytics cannot see them. This is the earliest
              signal that the AEO work is landing.
            </p>
            {summary.crawlers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No AI crawler hits recorded in this window yet.
              </p>
            ) : (
              <div className="space-y-1">
                {summary.crawlers.map((x) => (
                  <div
                    key={x.ai_crawler}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm bg-muted/60"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      {x.ai_crawler}
                    </span>
                    <span className="tabular-nums text-muted-foreground text-xs">
                      {x.hits} hits · last {new Date(x.last_seen).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <BarList
            title="Devices"
            empty="No device data yet."
            rows={summary.devices.map((x) => ({ label: x.device, value: x.visitors }))}
          />

          <BarList
            title="Countries"
            empty="No country data yet."
            rows={summary.countries.map((x) => ({ label: x.country, value: x.visitors }))}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
        Counted on the server, so ad-blockers and privacy browsers do not hide visitors the way they
        do in Google Analytics. No cookies and no IP addresses are stored — a visitor is identified
        by a one-way hash that changes every midnight, which is why this needs no cookie banner.
        Known scrapers and uptime monitors are dropped before they are ever written down.
      </p>
    </div>
  );
}
