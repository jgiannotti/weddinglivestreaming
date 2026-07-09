'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  defaultLocation?: string;
  defaultCategory?: string;
}

export function SearchBar({ variant = 'hero', defaultLocation = '', defaultCategory = '' }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  // Radix Select can't use an empty string as an item value, so "all" is the
  // sentinel for "no category filter" — translated back to "no param" below.
  const [category, setCategory] = useState(defaultCategory || 'all');
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (category && category !== 'all') params.set('category', category);
    router.push(`/directory?${params.toString()}`);
  }

  function handleLocateMe() {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
          if (city) setLocation(city);
        } catch {
          /* silent — user can type it themselves */
        }
      },
      undefined,
      { timeout: 5000 }
    );
  }

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col md:flex-row md:items-center gap-1.5 rounded-2xl md:rounded-full border bg-card p-1.5 transition-shadow',
        isHero ? 'shadow-lg shadow-primary/5' : 'shadow-sm',
        focused && 'ring-2 ring-primary/30'
      )}
    >
      <div className="flex-1 flex items-center gap-2 px-3.5 h-11 rounded-full md:rounded-l-full">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="City, state, or ZIP code"
          className="flex-1 min-w-0 bg-transparent text-sm focus-visible:outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Use my location"
          className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="hidden md:block h-6 w-px bg-border shrink-0" />

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-11 border-0 md:w-[180px] shrink-0 focus:ring-0">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" size={isHero ? 'lg' : 'default'} className="md:w-auto shrink-0">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
