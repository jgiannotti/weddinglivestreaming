import { redirect } from 'next/navigation';

/**
 * Password reset is part of Clerk's sign-in flow now ("Forgot password?" on
 * the sign-in card), so this route no longer needs its own form. Kept as a
 * redirect rather than deleted because the old reset emails, help docs, and
 * any bookmarks still point at /auth/reset.
 */
export default function ResetPage() {
  redirect('/auth/sign-in');
}
