import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container max-w-md py-20 text-center">
      <p className="font-display italic text-8xl md:text-9xl text-primary/25 mb-2">404</p>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">This page went off to elope</h1>
      <p className="text-muted-foreground mb-8">
        Let&rsquo;s get you back to the aisle &mdash; the page you&rsquo;re looking for may have moved or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/">Back to Home</Link></Button>
        <Button asChild variant="outline"><Link href="/directory">Browse Vendors</Link></Button>
      </div>
    </div>
  );
}
