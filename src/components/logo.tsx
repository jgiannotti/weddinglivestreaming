import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** Icon + wordmark sizing, e.g. 'text-xl', 'text-3xl' */
  textClassName?: string;
  iconClassName?: string;
  /** Use on dark (ink) surfaces — swaps the italic accent + icon to stay legible */
  dark?: boolean;
}

/**
 * Brand mark: a heart outline containing a small solid play-triangle
 * (heart = wedding, play = stream), followed by a two-tone wordmark.
 * Used in the header, footer, and (via icon.tsx/apple-icon.tsx) favicons.
 */
export function Logo({ className, textClassName = 'text-[22px]', iconClassName, dark = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-6 w-6 shrink-0', dark ? 'text-gold' : 'text-primary', iconClassName)}
        aria-hidden="true"
      >
        <path
          d="M12 20.6s-7.1-4.4-9.7-8.7C.7 9.1 1.5 5.6 4.5 4.4c2.3-.9 4.7 0 6 1.9.4.6 1.3.6 1.7 0 1.3-1.9 3.7-2.8 6-1.9 3 1.2 3.8 4.7 2.2 7.5-2.6 4.3-9.7 8.7-9.7 8.7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M10.3 9.4v5.2l4.4-2.6-4.4-2.6z" fill="currentColor" />
      </svg>
      <span className={cn('font-display leading-none', textClassName)}>
        <span className={cn('font-semibold', dark ? 'text-ink-foreground' : 'text-foreground')}>WeddingLive</span>
        <span className={cn('font-normal italic', dark ? 'text-gold' : 'text-primary')}>Streaming</span>
      </span>
    </span>
  );
}
