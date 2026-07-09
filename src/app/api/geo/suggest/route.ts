import { NextResponse } from 'next/server';
import { suggestCities } from '@/lib/data/geo';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

// Public, unauthenticated endpoint — cheap own-DB prefix lookups only (no
// third-party API calls happen server-side; Mapbox supplementation, if any,
// happens client-side with the public token). Rate-limited + capped so it
// can't be abused as a free scraping/DoS vector.

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited('geo-suggest', ip, { maxRequests: 40 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').slice(0, 60).trim();

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await suggestCities(q, 8);

  return NextResponse.json(
    { suggestions },
    {
      headers: {
        // City names rarely change — safe to cache at the CDN edge for an
        // hour, keyed by the exact query string.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
