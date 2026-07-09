'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Find Vendors', href: '/directory' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Vendors',  href: '/for-vendors' },
  { label: 'Pricing',      href: '/pricing' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open, and close it on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="WeddingLiveStreaming home">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3 py-2 text-[15px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/submit-listing">List Your Business</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          'md:hidden fixed inset-x-0 top-20 bottom-0 z-30 bg-background transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <nav className="container flex flex-col gap-1 pt-8">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'font-display text-3xl font-medium py-3 border-b border-border/60 transition-all duration-300',
                open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
              style={{ transitionDelay: open ? `${i * 60}ms` : '0ms' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div
          className={cn(
            'container mt-auto absolute bottom-10 left-0 right-0 flex flex-col gap-3 transition-all duration-300',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: open ? `${NAV.length * 60}ms` : '0ms' }}
        >
          <Button asChild size="lg" className="w-full">
            <Link href="/submit-listing">List Your Business</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
