import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, ListChecks, Users, Flag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NAV = [
  { label: 'Overview',         href: '/admin',          icon: LayoutDashboard },
  { label: 'Pending Listings', href: '/admin/listings', icon: ListChecks },
  { label: 'Vendors',          href: '/admin/vendors',  icon: Users },
  { label: 'Reports',          href: '/admin/reports',  icon: Flag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-medium mb-2">Database not connected</h1>
        <p className="text-muted-foreground">The admin panel needs Supabase to be configured. See SETUP.md.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <aside>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Admin</p>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
