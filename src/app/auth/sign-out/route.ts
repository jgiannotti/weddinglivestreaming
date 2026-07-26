import { NextResponse } from 'next/server';

/**
 * Clerk signs out client-side (it has to clear its own client state), so this
 * server route can't do it directly. The old POST /auth/sign-out endpoint is
 * kept as a redirect so any stale link lands somewhere sane; the header's
 * <UserButton /> and <SignOutButton /> handle the real sign-out.
 */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/', request.url));
}

export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
