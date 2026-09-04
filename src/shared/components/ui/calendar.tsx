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
        months: 'relative flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        // Non-interactive label; let clicks fall through to the nav buttons
        // (which the full-width caption otherwise overlaps and steals).
        month_caption:
          'pointer-events-none flex justify-center pt-1 relative items-center h-9',
        caption_label: 'text-sm font-medium capitalize',
        // The nav is a SIBLING of the month, not part of the caption, so it is
        // taken out of the flow entirely: left in it, its two absolute buttons
        // give it zero width while `months`'s `gap-4` still reserves 16px next
        // to it — dead space that read as stray padding down the left of the
        // calendar (and above it on mobile, where the gap runs vertically).
        nav: 'absolute inset-x-0 top-1 z-20 flex items-center justify-between px-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize',
        week: 'flex w-full mt-2',
        // The cell carries its own size instead of inheriting it from the
        // button inside. A day outside `startMonth`/`endMonth` still renders
        // its <td>, just with no button — and since the week is a flex row,
        // a cell with no intrinsic width collapses to 0 and shifts the rest of
        // the week left (1 May 2026, a Friday, drawn under Monday).
        day: cn(
          'relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
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
