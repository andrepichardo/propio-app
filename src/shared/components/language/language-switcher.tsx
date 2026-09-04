'use client';

import { useTransition, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { setLocale } from '@/i18n/actions';
import type { Locale } from '@/i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { FlagDO, FlagUS } from './flags';

type Option = {
  value: Locale;
  Flag: ComponentType<{ className?: string }>;
  labelKey: 'english' | 'spanish';
};

const OPTIONS: Option[] = [
  { value: 'en', Flag: FlagUS, labelKey: 'english' },
  { value: 'es', Flag: FlagDO, labelKey: 'spanish' },
];

function useLocaleSwitch() {
  const router = useRouter();
  const active = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === active) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return { active, isPending, change };
}

/** Standalone dropdown for pages without a user menu (e.g. auth screens). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('language');
  const { active, isPending, change } = useLocaleSwitch();
  const current = OPTIONS.find((o) => o.value === active) ?? OPTIONS[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        aria-label={t('label')}
        className={cn(
          'hover:bg-accent focus-visible:ring-ring inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-medium outline-hidden transition-colors focus-visible:ring-2',
          className,
        )}
      >
        <current.Flag />
        <span className="hidden sm:inline">{t(current.labelKey)}</span>
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {OPTIONS.map(({ value, Flag, labelKey }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => change(value)}
            className="gap-2"
          >
            <Flag />
            <span className="flex-1">{t(labelKey)}</span>
            {value === active ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Submenu meant to live inside another dropdown (e.g. the user menu). */
export function LanguageMenuSub() {
  const t = useTranslations('language');
  const { active, change } = useLocaleSwitch();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages /> {t('label')}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {OPTIONS.map(({ value, Flag, labelKey }) => (
            <DropdownMenuItem
              key={value}
              onSelect={() => change(value)}
              className="gap-2"
            >
              <Flag />
              <span className="flex-1">{t(labelKey)}</span>
              {value === active ? <Check className="size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
