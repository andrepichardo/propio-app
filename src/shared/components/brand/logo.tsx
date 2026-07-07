import { cn } from '@/shared/lib/utils';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Propio brand mark — a house glyph inside a rounded tile, paired with the
 * wordmark. Kept as inline SVG so it inherits currentColor and needs no asset.
 */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M4 11.5 12 5l8 6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10.5V19h12v-8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 19v-4h3v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight">Propio</span>
      ) : null}
    </span>
  );
}
