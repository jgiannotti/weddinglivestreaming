import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { shouldTrack, trackPageView } from '@/lib/track-request';

const isProtected = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

/**
 * Clerk replaces the old Supabase cookie-refresh middleware.
 *
 * Note this only enforces "signed in" — the admin ROLE check moved into
 * src/app/admin/layout.tsx via requireAdmin(). The old middleware queried
 * profiles.role on every matched request, which meant a database round trip
 * on public pages too. Role lives with the layout that needs it; middleware
 * just keeps anonymous traffic out.
 *
 * Middleware is also where first-party pageview logging happens (migration
 * 0015). It has to be here rather than in a client component: AI crawlers —
 * GPTBot, PerplexityBot, ClaudeBot — never execute JavaScript, so a
 * browser-side tracker like Vercel Web Analytics cannot see them at all. Their
 * crawl rate is the main leading indicator we have for the AEO work, and this
 * is the only layer that observes it.
 */
export default clerkMiddleware(async (auth, request, event) => {
  // Queued before the auth check so it still records on redirects, and
  // deliberately not awaited — waitUntil lets the response go out first, so a
  // slow Supabase write adds zero latency to the page.
  if (shouldTrack(request)) {
    event.waitUntil(trackPageView(request));
  }

  if (isProtected(request)) {
    const { userId } = await auth();
    if (!userId) {
      const next = request.nextUrl.pathname;
      return NextResponse.redirect(
        new URL(`/auth/sign-in?next=${encodeURIComponent(next)}`, request.url)
      );
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
