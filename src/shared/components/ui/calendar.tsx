'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** shadcn-style single-date calendar built on react-day-picker v10. */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        // Non-interactive label; let clicks fall through to the nav buttons
        // (which the full-width caption otherwise overlaps and steals).
        month_caption:
          'pointer-events-none flex justify-center pt-1 relative items-center h-9',
        caption_label: 'text-sm font-medium capitalize',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute left-1 top-1 z-20 size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute right-1 top-1 z-20 size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize',
        week: 'flex w-full mt-2',
        day: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}
