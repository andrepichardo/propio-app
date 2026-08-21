'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, setMonth as dfSetMonth } from 'date-fns';
import { es as esDateLocale } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';

/**
 * Month/year picker (value = `yyyy-MM`). Displays the selected month in the
 * active UI language ("Julio 2026" / "July 2026") via a popover with a year
 * navigator and a 12-month grid — replaces the locale-uncontrollable native
 * `<input type="month">`.
 */
export function MonthPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const locale = useLocale();
  const dfLocale = locale.slice(0, 2) === 'es' ? esDateLocale : undefined;
  const [open, setOpen] = useState(false);

  const selectedYear = value ? Number(value.slice(0, 4)) : undefined;
  const selectedMonth = value ? Number(value.slice(5, 7)) - 1 : undefined;
  const [year, setYear] = useState(selectedYear ?? new Date().getFullYear());

  const label = value
    ? format(new Date(selectedYear ?? 0, selectedMonth ?? 0, 1), 'MMMM yyyy', {
        locale: dfLocale,
      })
    : '';

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    format(dfSetMonth(new Date(2020, 0, 1), i), 'MMM', { locale: dfLocale }),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && selectedYear) setYear(selectedYear);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors',
            'hover:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <span className="truncate capitalize">{label}</span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 bg-transparent opacity-60 hover:opacity-100"
            aria-label={String(year - 1)}
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">{year}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 bg-transparent opacity-60 hover:opacity-100"
            aria-label={String(year + 1)}
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((name, i) => {
            const isSelected = selectedYear === year && selectedMonth === i;
            return (
              <Button
                key={name}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                className="capitalize"
                onClick={() => {
                  onChange(`${year}-${String(i + 1).padStart(2, '0')}`);
                  setOpen(false);
                }}
              >
                {name}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
