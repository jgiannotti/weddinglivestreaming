import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtected = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

/**
 * Clerk replaces the old Supabase cookie-refresh middleware.
 *
 * Note this only enforces "signed in" — the admin ROLE check moved into
 * src/app/admin/layout.tsx via requireAdmin(). The old middleware queried
 * profiles.role on every matched request, which meant a database round trip
 * on public pages too. Role lives with the layout that needs it; middleware
 * just keeps anonymous traffic out.
 */
export default clerkMiddleware(async (auth, request) => {
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
