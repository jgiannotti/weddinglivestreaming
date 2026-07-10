'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, X, ArrowRight } from 'lucide-react';
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

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open; close on Escape, and
  // close if the viewport crosses the md breakpoint (e.g. phone rotation) —
  // otherwise the hidden menu would strand the body scroll-lock.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    const mq = window.matchMedia('(min-width: 768px)');
    function onBreakpoint() {
      if (mq.matches) setOpen(false);
    }
    if (open) {
      window.addEventListener('keydown', onKey);
      mq.addEventListener('change', onBreakpoint);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onBreakpoint);
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center" aria-label="WeddingLiveStreaming home">
          {/* Compact wordmark below sm so the row always fits a 320–430px
              viewport — the header was the root cause of a site-wide
              horizontal overflow at phone widths. */}
          <Logo textClassName="text-lg sm:text-[22px]" iconClassName="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative px-3 py-2 text-[15px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute left-3 right-3 -bottom-0.5 h-px bg-primary origin-left transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          {/* Hidden on phones — the menu carries this CTA prominently instead. */}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/submit-listing">List Your Business</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 -mr-2"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

    </header>

      {/* Mobile menu — full-height ivory panel with a blush wash, editorial
          serif links, and the primary actions anchored at the bottom.
          Rendered as a SIBLING of the header, not a child: the header's
          backdrop-blur creates a containing block for fixed descendants
          (Filter Effects L2), which would resolve this panel's top/bottom
          against the 64px header and collapse it to 0 height on
          Chrome/Firefox. */}
      <div
        id="mobile-menu"
        className={cn(
          'md:hidden fixed inset-x-0 top-16 bottom-0 z-30 flex flex-col overflow-y-auto overscroll-contain',
          'bg-background bg-[radial-gradient(120%_60%_at_100%_0%,hsl(var(--accent)/0.55)_0%,transparent_60%)]',
          'transition-all duration-300 ease-out',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <nav className="container flex flex-col pt-6" aria-label="Mobile">
          <p className="eyebrow mb-2">Menu</p>
          {NAV.map((item, i) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={open ? 0 : -1}
                className={cn(
                  'group flex items-center justify-between border-b border-border/60 py-4 transition-all duration-300',
                  open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                )}
                style={{ transitionDelay: open ? `${80 + i * 55}ms` : '0ms' }}
              >
                <span className={cn('font-display text-[1.75rem] leading-none', active ? 'text-primary italic' : 'text-foreground')}>
                  {item.label}
                </span>
                <ArrowRight className="h-5 w-5 text-primary/40 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'container mt-auto flex flex-col gap-3 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-all duration-300',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
          style={{ transitionDelay: open ? `${80 + NAV.length * 55}ms` : '0ms' }}
        >
          <Button asChild size="lg" className="w-full" tabIndex={open ? 0 : -1}>
            <Link href="/submit-listing">List Your Business — Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full bg-card/60" tabIndex={open ? 0 : -1}>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <p className="mt-2 text-center font-display italic text-sm text-muted-foreground">
            Every love story deserves every guest.
          </p>
        </div>
      </div>
    </>
  );
}
