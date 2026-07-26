'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';

const ALL = 'all';

export type FilterOption = { id: string; label: string };

/**
 * URL-driven filter dropdown. Writes its value to a query param (clearing it
 * with the "all" option) and resets pagination, so the server component
 * re-fetches. Reusable for any single-value filter (property, tenant, …).
 */
export function QueryFilterSelect({
  param,
  options,
  allLabel,
  className,
}: {
  param: string;
  options: FilterOption[];
  allLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(param);
    else params.set(param, value);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={searchParams.get(param) ?? ALL} onValueChange={onChange}>
      <SelectTrigger className={cn('w-full sm:w-52', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
