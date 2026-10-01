import type { NextRequest } from 'next/server';
import {
  classifyReferrer,
  detectAiCrawler,
  detectDevice,
  isBot,
  visitorHash,
} from './traffic';

/**
 * Fire-and-forget pageview logging, called from middleware.
 *
 * Runs on the Edge runtime, so this talks to Supabase over plain REST rather
 * than importing @supabase/supabase-js — the client pulls in enough weight to
 * matter in a middleware bundle, and all we need is one INSERT.
 *
 * The caller wraps this in event.waitUntil(), which is the important part: the
 * response is already on its way to the visitor before this promise settles, so
 * a slow or failed Supabase write costs the page exactly nothing. Every failure
 * path below is deliberately silent for the same reason — analytics must never
 * be able to take the site down.
 */

/** Never log these: they're not content, and logging them would drown the signal. */
const SKIP_PREFIX = [
  '/_next',
  '/api',
  '/__clerk',
  '/admin',
  '/dashboard',
  '/auth',
  '/monitoring',
  '/.well-known',
];

/** Search crawlers worth keeping even though they're bots. */
const KEEP_BOT = /googlebot|bingbot|applebot|duckduckbot|yandexbot|baiduspider/i;

export function shouldTrack(req: NextRequest): boolean {
  if (req.method !== 'GET') return false;

  const { pathname } = req.nextUrl;
  if (SKIP_PREFIX.some((p) => pathname.startsWith(p))) return false;

  // Anything with a file extension is an asset, a feed, or a verification file,
  // not a page view. (Note this also drops /sitemap.xml and /robots.txt, which
  // are crawler plumbing rather than content.)
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false;

  // Only real page loads are counted here.
  //
  // This used to test the `rsc` header and the `_rsc` query to skip Next.js
  // data requests. That test could never be true: Next removes those headers
  // and that query from the request before middleware sees it. So every link
  // PREFETCH was logged as a page view. In production <Link> prefetches each
  // link as it scrolls into view, which means showing a vendor's card on the
  // directory counted as someone opening that vendor's profile, and every
  // page in the header and footer collected a "view" on every visit.
  //
  // Browsers label every request with what it is for. A page load is
  // `document`; a prefetch or an in-app navigation is a fetch() and arrives as
  // `empty`. Crawlers send no such header and are kept, as before.
  if (!isDocumentRequest(req.headers)) return false;

  return true;
}

/**
 * True for a top-level page load (or a client that does not say, such as a
 * crawler). False for anything a script fetched in the background.
 *
 * A page the browser loads ahead of time (Chrome preloading the top search
 * result, say) is still a page load and is counted: if the visitor then opens
 * it there is no second request, so skipping it would lose real visits from
 * search, the number this log exists to measure.
 */
export function isDocumentRequest(headers: Headers): boolean {
  const dest = headers.get('sec-fetch-dest');
  if (dest) return dest === 'document';

  // No label at all. Crawlers never send one, and they must be logged.
  if (isBot(headers.get('user-agent') ?? '')) return true;

  // A browser too old to send one (Safari before 16.4) still prefetches links.
  // A page load asks for text/html; a background fetch asks for "*/*".
  const accept = headers.get('accept');
  return !accept || /text\/html/i.test(accept);
}

/** What logPageView needs to know about a request. */
export interface PageHit {
  headers: Headers;
  pathname: string;
  /** This site's own hostname, so internal referrers are recognised. */
  hostname: string;
  searchParams?: URLSearchParams;
}

export function trackPageView(req: NextRequest): Promise<void> {
  return logPageView({
    headers: req.headers,
    pathname: req.nextUrl.pathname,
    hostname: req.nextUrl.hostname,
    searchParams: req.nextUrl.searchParams,
  });
}

/**
 * Write one page_views row. Shared by middleware (page loads) and by
 * src/lib/track-navigation.ts (in-app navigations to a listing).
 */
export async function logPageView(hit: PageHit): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const req = { headers: hit.headers };
    const ua = req.headers.get('user-agent') ?? '';
    const aiCrawler = detectAiCrawler(ua);
    const bot = isBot(ua);

    // Keep humans, keep AI crawlers, keep the big search engines. Drop SEO
    // scrapers, uptime pingers and the rest — they'd be most of the rows and
    // none of the insight.
    if (bot && !aiCrawler && !KEEP_BOT.test(ua)) return;

    const referrer = req.headers.get('referer');
    let referrerHost: string | null = null;
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname.replace(/^www\./, '');
      } catch {
        referrerHost = null;
      }
    }

    const selfHost = hit.hostname;
    const params = hit.searchParams ?? new URLSearchParams();

    // Only real visitors get a visitor_hash — see the note in 0015_page_views.
    let hash: string | null = null;
    if (!bot) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '0.0.0.0';
      // TRACKING_SALT is optional: falling back to the service-role key means
      // this works with zero new environment variables. Rotating that key
      // rotates the salt too, which only affects unique-visitor counts for the
      // day of the rotation.
      hash = await visitorHash(ip, ua, process.env.TRACKING_SALT || key);
    }

    const row = {
      path: hit.pathname,
      visitor_hash: hash,
      referrer_host: referrerHost,
      source: classifyReferrer(referrerHost, selfHost),
      utm_source: params.get('utm_source')?.slice(0, 120) ?? null,
      utm_medium: params.get('utm_medium')?.slice(0, 120) ?? null,
      utm_campaign: params.get('utm_campaign')?.slice(0, 120) ?? null,
      country: req.headers.get('x-vercel-ip-country'),
      device: detectDevice(ua),
      is_bot: bot,
      ai_crawler: aiCrawler,
    };

    await fetch(`${url}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // Don't ask Postgres to send the inserted row back; we'd only throw it away.
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Swallowed on purpose. A broken analytics write must never surface to a
    // visitor or block the response.
  }
}
