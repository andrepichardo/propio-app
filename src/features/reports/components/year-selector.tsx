'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const YEARS_BACK = 5;

export function YearSelector({ selectedYear }: { selectedYear: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_BACK }, (_, i) => currentYear - i);

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (Number(value) === currentYear) params.delete('year');
    else params.set('year', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={String(selectedYear)} onValueChange={onChange}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
