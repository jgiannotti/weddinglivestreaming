import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

// Backs the "Near me" button — browser geolocation coordinates in, nearest
// own-DB city out. No third-party reverse-geocoding call. Public and
// unauthenticated like /api/geo/suggest, so it gets the same rate limiting
// (found missing in a Milestone 2 security re-audit — a script could
// otherwise hammer it with random lat/lng pairs and run up Supabase
// request-quota usage for free).
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited('geo-nearest', ip, { maxRequests: 40 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('nearest_city', { search_lat: lat, search_lng: lng });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ city: null });
  }

  const row = data[0];
  return NextResponse.json({
    city: { name: row.name, stateCode: row.state_code, label: `${row.name}, ${row.state_code}` },
  });
}
