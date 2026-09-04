'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { es as esDateLocale } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useFormatDate } from '@/shared/components/date-format-provider';
import { toDateInputValue } from '@/shared/lib/format';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { Button } from './button';

/**
 * Parse any accepted value into a local-midnight Date the calendar can select.
 *
 * Exported because callers that derive a bound from another field (a contract's
 * end date from its start date) need the same parsing — `value` may be a Date
 * or a `yyyy-MM-dd` string depending on whether the form has been touched.
 */
export function toLocalDate(
  value: Date | string | null | undefined,
): Date | undefined {
  const ymd = toDateInputValue(value);
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return undefined;
  return new Date(y, m - 1, d);
}

/**
 * Date field that displays the value in the owner's chosen format (Settings →
 * Format) and picks via a calendar. Drop-in for `<input type="date">`: `value`
 * accepts a Date or `yyyy-MM-dd` string, `onChange` emits `yyyy-MM-dd` (or ''
 * when cleared).
 *
 * `minDate`/`maxDate` are INCLUSIVE bounds: days outside them are greyed out,
 * the month navigation stops there, and an empty field opens on the bound
 * rather than on today (which would otherwise land on a month with nothing
 * selectable). To exclude the bound itself — an end date must be AFTER the
 * start, not equal to it — pass the neighbouring day.
 */
export function DatePicker({
  value,
  onChange,
  id,
  disabled,
  clearable,
  minDate,
  maxDate,
}: {
  value: Date | string | null | undefined;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  clearable?: boolean;
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
}) {
  const formatDate = useFormatDate();
  const locale = useLocale();
  const t = useTranslations('datePicker');
  const [open, setOpen] = useState(false);
  const selected = toLocalDate(value);
  const min = toLocalDate(minDate);
  const max = toLocalDate(maxDate);
  const outOfRange = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors',
            'hover:border-ring focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {selected ? formatDate(selected) : t('placeholder')}
          </span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? min ?? max}
          startMonth={min}
          endMonth={max}
          disabled={outOfRange.length > 0 ? outOfRange : undefined}
          autoFocus
          locale={locale.slice(0, 2) === 'es' ? esDateLocale : undefined}
          onSelect={(date) => {
            onChange(date ? toDateInputValue(date) : '');
            setOpen(false);
          }}
        />
        {clearable && selected ? (
          <div className="mt-2 flex justify-end border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <X className="size-4" /> {t('clear')}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
