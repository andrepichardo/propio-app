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
import { CONTRACT_STATUS_VALUES } from '../constants';

const ALL = 'all';

export function ContractStatusFilter() {
  const t = useTranslations('contracts');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete('status');
    else params.set('status', value);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      defaultValue={searchParams.get('status') ?? ALL}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder={t('statusPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
        {CONTRACT_STATUS_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`statuses.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
