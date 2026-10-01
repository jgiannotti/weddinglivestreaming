// Real numbers for the vendor dashboard (server-only).
//
// The dashboard used to read listings.view_count and listings.inquiry_count.
// Neither was ever written in production: increment_view_count() had no
// caller, and increment_inquiry_count() runs as the couple, whose RLS identity
// cannot update a vendor's listing. Every vendor therefore saw "0 views,
// 0 inquiries" directly above the upgrade prompt.
//
// The first-party pageview log (migration 0015) already records every listing
// page view with bots and AI crawlers classified, so the truthful numbers were
// sitting one table away. page_views is service-role only (RLS on, no
// policies), which is why this goes through the admin client. Callers must only
// ever pass slugs of listings the signed-in vendor owns.

import { createAdminClient } from '@/lib/supabase/server';
import { dayAfterRelease } from '@/lib/release';

/**
 * Answer engines whose visits a vendor would recognise by name: the crawlers
 * that build each engine's search index, and the "live" fetchers that open a
 * page while answering one person's question.
 *
 * GPTBot and ClaudeBot are NOT here. They collect training data. They are by
 * far the busiest crawlers on the site, and counting them would let a vendor
 * read "ChatGPT looked me up 40 times" into what was a routine crawl.
 */
export const AI_ASSISTANT_AGENTS = [
  'ChatGPT-User',
  'OAI-SearchBot',
  'Claude-User',
  'Claude-SearchBot',
  'Perplexity-User',
  'PerplexityBot',
];

export const STATS_WINDOW_DAYS = 30;

/**
 * The first day whose page_views rows can be trusted for "profile views": the
 * day after the release that fixed the counter (src/lib/release.ts).
 *
 * Before that release every link prefetch was stored as a view (see
 * src/lib/track-request.ts), so a vendor's count went up each time their card
 * was merely shown on a directory page. Those rows cannot be told apart from
 * real visits after the fact, so vendor-facing numbers start here instead. The
 * release day itself is left out because its hours before the deploy are
 * inflated too.
 */
export const VIEWS_COUNTED_FROM = dayAfterRelease();

export interface ListingTraffic {
  /** Times the listing was opened in a browser (not a bot) in the United States. */
  views: number;
  /** Times an AI assistant or its search crawler opened the profile. */
  aiVisits: number;
  /** First day counted (YYYY-MM-DD): the window start, or VIEWS_COUNTED_FROM if later. */
  since: string;
  /** True while the counting window is shorter than STATS_WINDOW_DAYS. */
  partialWindow: boolean;
}

function sinceDay(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface StatsWindow {
  /** First day counted (YYYY-MM-DD). */
  since: string;
  /** True while the counting window is shorter than STATS_WINDOW_DAYS. */
  partialWindow: boolean;
  /**
   * True while `since` is still ahead of today (UTC): the release day itself,
   * when counting starts tomorrow. The dashboard words that as "counting
   * starts", because "0 views since <tomorrow>" reads like a fault.
   */
  notStarted: boolean;
}

/** The window the dashboard reports on: the last 30 days, never earlier than VIEWS_COUNTED_FROM. */
export function statsWindow(now: Date = new Date(), floor: string = VIEWS_COUNTED_FROM): StatsWindow {
  const windowStart = sinceDay(STATS_WINDOW_DAYS, now);
  if (floor <= windowStart) return { since: windowStart, partialWindow: false, notStarted: false };
  return { since: floor, partialWindow: true, notStarted: floor > now.toISOString().slice(0, 10) };
}

/**
 * Traffic for one listing over the last 30 days. Returns null when the numbers
 * cannot be read (missing service key, query error) so the UI can show a dash
 * instead of a misleading zero.
 */
export async function getListingTraffic(slug: string, now: Date = new Date()): Promise<ListingTraffic | null> {
  if (!slug || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const admin = await createAdminClient();
    const path = `/listing/${slug}`;
    const { since, partialWindow } = statsWindow(now);

    const [humans, assistants] = await Promise.all([
      admin
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('path', path)
        .gte('day', since)
        .eq('is_bot', false)
        .is('ai_crawler', null)
        // Scrapers that do not announce themselves arrive overwhelmingly from
        // outside the US; couples booking a US vendor do not. Counting US views
        // only keeps this number honest rather than flattering.
        .eq('country', 'US'),
      admin
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('path', path)
        .gte('day', since)
        .in('ai_crawler', AI_ASSISTANT_AGENTS),
    ]);

    if (humans.error || assistants.error) return null;
    return { views: humans.count ?? 0, aiVisits: assistants.count ?? 0, since, partialWindow };
  } catch {
    return null;
  }
}
