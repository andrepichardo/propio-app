'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants';

const ALL = 'all';

export function ExpenseCategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete('category');
    else params.set('category', value);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      defaultValue={searchParams.get('category') ?? ALL}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All categories</SelectItem>
        {EXPENSE_CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
