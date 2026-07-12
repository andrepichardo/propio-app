'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { EXPENSE_CATEGORY_VALUES } from '../constants';

const ALL = 'all';

export function ExpenseCategoryFilter() {
  const t = useTranslations('expenses');
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
        <SelectValue placeholder={t('category')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('allCategories')}</SelectItem>
        {EXPENSE_CATEGORY_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`categories.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
