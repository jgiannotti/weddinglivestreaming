import { NextResponse, type NextRequest } from 'next/server';

// Clerk handles the OAuth/email-link handshake entirely inside its own
// components and middleware, so there is no code to exchange here any more.
// The route survives only so that Google's cached redirect URI, old
// confirmation emails, and any stale bookmark land somewhere sane instead
// of 404ing.
export async function GET(request: NextRequest) {
  const next = new URL(request.url).searchParams.get('next') ?? '/dashboard';
  const safe = next.startsWith('/') ? next : '/dashboard';
  return NextResponse.redirect(new URL(safe, request.url));
}
