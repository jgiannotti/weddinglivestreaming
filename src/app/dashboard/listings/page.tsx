import { redirect } from 'next/navigation';

// The dashboard Overview already lists the vendor's listings, so this route
// exists only to catch old links (sidebar nav, post-submit redirects) that
// pointed at /dashboard/listings — which previously 404'd.
export default function DashboardListingsPage() {
  redirect('/dashboard');
}
