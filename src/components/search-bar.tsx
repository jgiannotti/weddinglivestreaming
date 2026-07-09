'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { POPULAR_CITIES, type CitySuggestion } from '@/lib/geo-constants';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  defaultLocation?: string;
  defaultCategory?: string;
}

const RECENT_SEARCHES_KEY = 'wls:recentSearches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(label: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentSearches().filter((s) => s.toLowerCase() !== label.toLowerCase());
    const next = [label, ...existing].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode etc.) — non-fatal */
  }
}

// Mapbox Search Box suggest response item — only the fields we use.
interface MapboxSuggestion {
  mapbox_id: string;
  name: string;
  place_formatted: string;
}

export function SearchBar({ variant = 'hero', defaultLocation = '', defaultCategory = '' }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  // Radix Select can't use an empty string as an item value, so "all" is the
  // sentinel for "no category filter" — translated back to "no param" below.
  const [category, setCategory] = useState(defaultCategory || 'all');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [ownSuggestions, setOwnSuggestions] = useState<CitySuggestion[]>([]);
  const [mapboxSuggestions, setMapboxSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const recentSearches = useMemo(() => (typeof window !== 'undefined' ? getRecentSearches() : []), [focused]);

  // Combined option list shown in the dropdown, in display order.
  type Option = { kind: 'own' | 'mapbox' | 'recent' | 'popular'; label: string; sub?: string };
  const options: Option[] = useMemo(() => {
    if (location.trim().length < 2) {
      const recentOpts: Option[] = recentSearches.map((s) => ({ kind: 'recent', label: s }));
      const popularOpts: Option[] = POPULAR_CITIES
        .filter((c) => !recentSearches.some((r) => r.toLowerCase() === c.label.toLowerCase()))
        .map((c) => ({ kind: 'popular', label: c.label }));
      return [...recentOpts, ...popularOpts].slice(0, 8);
    }
    const own: Option[] = ownSuggestions.map((c) => ({ kind: 'own', label: c.label }));
    const mb: Option[] = mapboxSuggestions.map((m) => ({ kind: 'mapbox', label: m.name, sub: m.place_formatted }));
    return [...own, ...mb].slice(0, 8);
  }, [location, ownSuggestions, mapboxSuggestions, recentSearches]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [options.length]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = location.trim();
    if (query.length < 2) {
      setOwnSuggestions([]);
      setMapboxSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const own: CitySuggestion[] = data.suggestions ?? [];
        setOwnSuggestions(own);

        // Mapbox supplement only when our own DB is thin (<3) and a public
        // token is configured — feature-flagged so the site never breaks
        // without Mapbox. Session token is per keystroke series (billing
        // best practice) and reset once the field is cleared.
        if (own.length < 3 && mapboxToken) {
          if (!sessionTokenRef.current) sessionTokenRef.current = crypto.randomUUID();
          const mbRes = await fetch(
            `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&session_token=${sessionTokenRef.current}&access_token=${mapboxToken}&country=us&types=place,postcode&limit=5`
          );
          if (mbRes.ok) {
            const mbData = await mbRes.json();
            setMapboxSuggestions(mbData.suggestions ?? []);
          } else {
            setMapboxSuggestions([]);
          }
        } else {
          setMapboxSuggestions([]);
        }
      } catch {
        /* silent — user can still type + submit manually */
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [location, mapboxToken]);

  function submitSearch(loc: string) {
    const trimmed = loc.trim();
    if (trimmed) addRecentSearch(trimmed);
    sessionTokenRef.current = null;
    setOpen(false);
    const params = new URLSearchParams();
    if (trimmed) params.set('location', trimmed);
    if (category && category !== 'all') params.set('category', category);
    router.push(`/directory?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitSearch(location);
  }

  function selectOption(opt: Option) {
    setLocation(opt.label);
    submitSearch(opt.label);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        selectOption(options[activeIndex]);
      }
      // else: let the form's native submit handle a raw Enter with no selection
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleLocateMe() {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/geo/nearest?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (data.city?.label) {
            setLocation(data.city.label);
            inputRef.current?.focus();
          }
        } catch {
          /* silent — user can type it themselves */
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 6000 }
    );
  }

  const isHero = variant === 'hero';
  const showDropdown = open && focused && options.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex flex-col md:flex-row md:items-center gap-1.5 rounded-2xl md:rounded-full border bg-card p-1.5 transition-shadow',
        isHero ? 'shadow-lg shadow-primary/5' : 'shadow-sm',
        focused && 'ring-2 ring-primary/30'
      )}
    >
      <div className="relative flex-1">
        <div className="flex items-center gap-2 px-3.5 h-11 rounded-full md:rounded-l-full">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => {
              // Delay so a click on a dropdown option registers before we close it.
              setTimeout(() => {
                setFocused(false);
                setOpen(false);
              }, 150);
            }}
            onKeyDown={handleKeyDown}
            placeholder="City, state, or ZIP code"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-sm focus-visible:outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            aria-label="Use my location"
            className="flex items-center justify-center h-10 w-10 -my-1 rounded-full text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors shrink-0 disabled:opacity-50"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showDropdown && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 z-50 max-h-72 overflow-auto rounded-2xl border bg-popover shadow-lg py-1.5"
          >
            {location.trim().length < 2 && (
              <li className="px-4 pt-1 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {recentSearches.length > 0 ? 'Recent & popular' : 'Popular cities'}
              </li>
            )}
            {options.map((opt, i) => (
              <li key={`${opt.kind}-${opt.label}-${i}`} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors',
                    activeIndex === i ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {opt.label}
                    {opt.sub && <span className="text-muted-foreground"> — {opt.sub}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
