// Counting in-app navigations to a page (server-only).
//
// Middleware counts page LOADS. When a visitor is already on the site and
// clicks through to a vendor, the browser does not load a new page: the app
// fetches the next screen in the background. Middleware cannot count that,
// because the same kind of background fetch is also how links are prefetched
// before anyone clicks them, and Next hides the difference from middleware
// (and from server components: the `rsc` and `next-router-prefetch` headers
// are removed from headers() as well).
//
// What does tell them apart is whether the page gets rendered at all. For a
// route that is rendered per request, a link prefetch stops at the layout and
// never runs the page component. So if a page component is running for a
// background fetch (the browser labels it `sec-fetch-dest: empty`), a visitor
// really did navigate to it. A page that wants its in-app visits counted calls
// trackNavigation() while rendering.
//
// Used by the listing page, because "how many times was my profile opened" is
// a number vendors are shown, and most profile visits start on a directory
// page. Two things this depends on, both covered by the browser tests:
//   - the route is rendered per request (the listing page is), and
//   - links to it use the default prefetch. A <Link prefetch={true}> renders
//     the page in advance and would be counted as a visit.

import { headers } from 'next/headers';
import { after } from 'next/server';
import { logPageView } from './track-request';

export async function trackNavigation(pathname: string): Promise<void> {
  try {
    const h = await headers();

    // A full page load, or a client that does not say (crawlers): middleware
    // already counted it.
    if (h.get('sec-fetch-dest') !== 'empty') return;

    // The app refreshing the page the visitor is already on (router.refresh()
    // after a form, for instance) is not a new visit.
    const referer = h.get('referer');
    if (referer) {
      try {
        if (new URL(referer).pathname === pathname) return;
      } catch {
        /* unparseable referer: count it */
      }
    }

    // Copy what logging needs now; the request scope is gone by the time
    // after() runs.
    const snapshot = new Headers();
    for (const name of ['user-agent', 'referer', 'x-forwarded-for', 'x-real-ip', 'x-vercel-ip-country']) {
      const value = h.get(name);
      if (value) snapshot.set(name, value);
    }
    const hostname = (h.get('x-forwarded-host') || h.get('host') || '').split(':')[0];

    // After the response is sent, so it costs the visitor nothing.
    after(() => logPageView({ headers: snapshot, pathname, hostname }));
  } catch {
    // Analytics must never be able to break a page.
  }
}
