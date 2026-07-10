import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, ListChecks, Users, Flag, UserPlus, Mail, Tags, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NAV = [
  { label: 'Overview',         href: '/admin',              icon: LayoutDashboard },
  { label: 'Pending Listings', href: '/admin/listings',     icon: ListChecks },
  { label: 'Profile Claims',   href: '/admin/claims',       icon: ShieldCheck },
  { label: 'Vendors',          href: '/admin/vendors',      icon: Users },
  { label: 'Reports',          href: '/admin/reports',      icon: Flag },
  { label: 'Leads',            href: '/admin/leads',        icon: UserPlus },
  { label: 'Subscribers',      href: '/admin/subscribers',  icon: Mail },
  { label: 'Categories',       href: '/admin/categories',   icon: Tags },
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

  // Strongly prompt 2FA for the admin account — it controls the whole site.
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const hasTwoFactor = (mfaData?.totp || []).some((f) => f.status === 'verified');

  return (
    <div className="container py-10">
      {!hasTwoFactor && (
        <div className="mb-8 p-4 rounded-2xl border border-primary/30 bg-primary/5 text-sm flex flex-wrap items-center justify-between gap-3">
          <p className="m-0">
            <span className="font-semibold">Protect your admin account:</span> this account can
            approve vendors, read leads, and manage the whole site — turn on two-factor
            authentication.
          </p>
          <Link
            href="/dashboard/security"
            className="shrink-0 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ShieldCheck className="h-4 w-4" /> Set up 2FA
          </Link>
        </div>
      )}
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
