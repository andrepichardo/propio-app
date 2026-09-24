'use client';

import { useTranslations } from 'next-intl';
import { BillingInterval, type Plan } from '@/generated/prisma/enums';
import { formatUsd, isPaidPlan, monthlyEquivalent, PLANS } from '../plans';

/** Price, period and — on yearly — the per-month equivalent. Always reserves the third line so cards stay aligned. */
export function PlanPrice({
  plan,
  interval,
}: {
  plan: Plan;
  interval: BillingInterval;
}) {
  const t = useTranslations('plans');
  const yearly = interval === BillingInterval.YEAR && isPaidPlan(plan);

  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">
          {formatUsd(PLANS[plan].price[yearly ? 'YEAR' : 'MONTH'])}
        </span>
        <span className="text-muted-foreground text-sm">
          {yearly ? t('perYear') : t('perMonth')}
        </span>
      </p>
      <p className="text-muted-foreground mt-1 h-5 text-xs">
        {yearly
          ? t('billedYearly', { monthly: formatUsd(monthlyEquivalent(plan)) })
          : null}
      </p>
    </div>
  );
}
