import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/safe-next';

// Clerk handles the OAuth/email-link handshake entirely inside its own
// components and middleware, so there is no code to exchange here any more.
// The route survives only so that Google's cached redirect URI, old
// confirmation emails, and any stale bookmark land somewhere sane instead
// of 404ing.
export async function GET(request: NextRequest) {
  // Same-site paths only. This used to redirect to whatever `next` said,
  // which made it an open redirect ("//host", "/\\host", "/<tab>/host").
  const safe = safeNextPath(new URL(request.url).searchParams.get('next'));
  return NextResponse.redirect(new URL(safe, request.url));
}
