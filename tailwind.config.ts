import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '2rem',
        lg: '3rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        // Wedding industry palette: warm, romantic, elegant
        // Primary: deep rose (signals love/wedding without being saccharine)
        // Accent: muted gold (premium/featured tier)
        // Neutrals: warm cream/stone (vs cold gray)
        //
        // NOTE: every entry uses the `hsl(var(--x) / <alpha-value>)` pattern
        // (not bare `hsl(var(--x))`) — Tailwind v3 requires this placeholder
        // for opacity modifiers like `bg-ink/70` or `text-primary/80` to work
        // on CSS-variable-based colors. Without it, `/NN` opacity is silently
        // dropped and every token renders at 100% opacity.
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold) / <alpha-value>)',
          foreground: 'hsl(var(--gold-foreground) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          foreground: 'hsl(var(--ink-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
