'use client';

import { useTranslations } from 'next-intl';
import { BillingInterval } from '@/generated/prisma/enums';
import { cn } from '@/shared/lib/utils';
import { BILLING_INTERVALS } from '../plans';

export function IntervalToggle({
  value,
  onValueChange,
  className,
}: {
  value: BillingInterval;
  onValueChange: (value: BillingInterval) => void;
  className?: string;
}) {
  const t = useTranslations('plans');

  return (
    <div
      role="radiogroup"
      className={cn(
        'bg-muted/60 inline-flex items-center gap-1 rounded-full border p-1',
        className,
      )}
    >
      {BILLING_INTERVALS.map((interval) => {
        const active = interval === value;
        return (
          <button
            key={interval}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(interval)}
            className={cn(
              'focus-visible:ring-ring inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium outline-hidden transition-colors focus-visible:ring-2',
              active
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {interval === BillingInterval.MONTH ? t('monthly') : t('yearly')}
            {interval === BillingInterval.YEAR ? (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                {t('yearlyBadge')}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
