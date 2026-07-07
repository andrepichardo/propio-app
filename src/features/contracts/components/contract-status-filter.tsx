'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { CONTRACT_STATUS_OPTIONS } from '../constants';

const ALL = 'all';

export function ContractStatusFilter() {
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
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All statuses</SelectItem>
        {CONTRACT_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
