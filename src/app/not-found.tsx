import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container max-w-md py-20 text-center">
      <p className="text-sm font-medium tracking-wider uppercase text-primary mb-3">404</p>
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Page not found</h1>
      <p className="text-muted-foreground mb-8">
        We couldn&rsquo;t find what you were looking for. It may have moved or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/directory">Browse vendors</Link></Button>
      </div>
    </div>
  );
}
