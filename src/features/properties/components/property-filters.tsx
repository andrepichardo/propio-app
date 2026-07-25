'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  PROPERTY_STATUS_VALUES,
  PROPERTY_TYPE_VALUES,
} from '../constants';

const ALL = 'all';

/**
 * URL-driven filters. State lives in the query string so the server component
 * re-fetches, results are shareable/bookmarkable, and the back button works.
 */
export function PropertyFilters() {
  const t = useTranslations('properties');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const commit = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) params.delete(key);
        else params.set(key, value);
      }
      // Any filter change resets pagination.
      params.delete('page');
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  // Debounce free-text search to avoid a request per keystroke.
  useEffect(() => {
    const current = searchParams.get('search') ?? '';
    if (search === current) return;
    const timeout = setTimeout(() => commit({ search }), 350);
    return () => clearTimeout(timeout);
  }, [search, searchParams, commit]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
          data-pending={isPending ? '' : undefined}
        />
      </div>
      <Select
        defaultValue={searchParams.get('type') ?? ALL}
        onValueChange={(value) => commit({ type: value })}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder={t('type')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('allTypes')}</SelectItem>
          {PROPERTY_TYPE_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`types.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('status') ?? ALL}
        onValueChange={(value) => commit({ status: value })}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder={t('status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
          {PROPERTY_STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`statuses.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
