// Test double for '@clerk/nextjs/server' (wired in by scripts/e2e/tsconfig.json).
// The "signed-in user" is whatever the test put in globalThis.__E2E_USER__.

interface E2EUser {
  id: string;
  email: string;
  token: string;
  firstName?: string;
  lastName?: string;
}

function current(): E2EUser | null {
  return ((globalThis as any).__E2E_USER__ as E2EUser | null) ?? null;
}

export async function auth() {
  const u = current();
  return {
    userId: u?.id ?? null,
    getToken: async (_opts?: unknown) => u?.token ?? null,
  };
}

export async function currentUser() {
  const u = current();
  if (!u) return null;
  return {
    id: u.id,
    primaryEmailAddressId: 'email_1',
    emailAddresses: [{ id: 'email_1', emailAddress: u.email, verification: { status: 'verified' } }],
    firstName: u.firstName ?? 'Test',
    lastName: u.lastName ?? 'Vendor',
    username: null,
  };
}

export function clerkMiddleware() {
  throw new Error('clerkMiddleware is not available in the e2e harness');
}
export function createRouteMatcher() {
  return () => false;
}
