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

  // Next.js client-side navigations refetch RSC payloads for a route the user
  // is already on; counting them would double every soft navigation.
  if (req.headers.get('rsc') === '1' || req.nextUrl.searchParams.has('_rsc')) return false;

  return true;
}

export async function trackPageView(req: NextRequest): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
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

    const selfHost = req.nextUrl.hostname;
    const params = req.nextUrl.searchParams;

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
      path: req.nextUrl.pathname,
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
