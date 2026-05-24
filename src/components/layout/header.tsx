import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Menu } from 'lucide-react';

const NAV = [
  { label: 'Find Vendors', href: '/directory' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Vendors',  href: '/for-vendors' },
  { label: 'Pricing',      href: '/pricing' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Heart className="h-5 w-5 fill-primary text-primary" />
          <span>WeddingLiveStreaming</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/submit-listing">List Your Business</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
