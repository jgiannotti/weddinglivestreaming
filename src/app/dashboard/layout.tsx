import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, MessageSquare, CreditCard, LogOut, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NAV = [
  // "My Listings" removed: /dashboard/listings just redirects to Overview,
  // which already shows the vendor's listings — two nav items to one page.
  { label: 'Overview',     href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Inquiries',    href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Plan',         href: '/dashboard/plan',     icon: CreditCard },
  { label: 'Security',     href: '/dashboard/security', icon: ShieldCheck },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-medium mb-2">Database not connected</h1>
        <p className="text-muted-foreground">The dashboard needs Supabase to be configured. See SETUP.md.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/dashboard');

  const { data: profile } = await supabase.from('profiles').select('display_name, email, role').eq('id', user.id).single();

  return (
    <div className="container py-10 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <aside>
          <div className="mb-6 pb-6 border-b">
            <p className="font-semibold truncate">{profile?.display_name || 'Vendor'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
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
            <form action="/auth/sign-out" method="post" className="pt-2 mt-2 border-t">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
