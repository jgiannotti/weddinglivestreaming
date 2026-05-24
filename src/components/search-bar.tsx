'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/categories';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  defaultLocation?: string;
  defaultCategory?: string;
}

export function SearchBar({ variant = 'hero', defaultLocation = '', defaultCategory = '' }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [category, setCategory] = useState(defaultCategory);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (category) params.set('category', category);
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
      className={
        isHero
          ? 'flex flex-col md:flex-row gap-2 p-2 bg-white rounded-2xl shadow-xl border'
          : 'flex flex-col sm:flex-row gap-2'
      }
    >
      <div className="flex-1 flex items-center gap-2 px-3 rounded-lg bg-muted/40">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state, or ZIP code"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Use my location"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <MapPin className="h-4 w-4" />
        </button>
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <Button type="submit" size={isHero ? 'lg' : 'default'} className="md:w-auto">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
