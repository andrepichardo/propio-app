'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * Compact light/dark switch for pages without a user menu (landing, legal).
 *
 * Which icon shows is decided by CSS off the `dark` class, not by React state.
 * `next-themes` only knows the resolved theme after hydration, so a
 * state-driven icon would either mismatch on the server pass or need a
 * `mounted` flag set inside an effect — and the CSS swap avoids both while
 * rendering correctly on the very first paint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('userMenu');
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={t('theme')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md border outline-hidden transition-colors focus-visible:ring-2',
        className,
      )}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
