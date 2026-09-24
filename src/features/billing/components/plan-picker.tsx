'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { BillingInterval, type Plan } from '@/generated/prisma/enums';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { changePlanAction } from '../actions/billing.actions';
import {
  formatUsd,
  isPaidPlan,
  type PaidPlan,
  PLAN_ORDER,
  PLANS,
  type PriceIds,
} from '../plans';
import { IntervalToggle } from './interval-toggle';
import { PlanPrice } from './plan-price';
import { type PaddleClientConfig, usePaddle } from './use-paddle';

type LiveSubscription = {
  plan: PaidPlan;
  interval: BillingInterval;
  cancelAtPeriodEnd: boolean;
};

type PendingChange = {
  plan: PaidPlan;
  kind: 'change' | 'interval' | 'resume';
};

export function PlanPicker({
  plan: currentPlan,
  subscription,
  propertyCount,
  priceIds,
  paddleConfig,
  customer,
}: {
  plan: Plan;
  subscription: LiveSubscription | null;
  propertyCount: number;
  priceIds: PriceIds | null;
  paddleConfig: PaddleClientConfig | null;
  customer: { ownerId: string; email: string | null };
}) {
  const t = useTranslations('billing');
  const tp = useTranslations('plans');
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const paddle = usePaddle(paddleConfig);
  const [interval, setBillingInterval] = useState<BillingInterval>(
    subscription?.interval ?? BillingInterval.MONTH,
  );
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [isPending, startTransition] = useTransition();

  const enabled = Boolean(priceIds && paddleConfig);

  function openCheckout(plan: PaidPlan) {
    if (!paddle || !priceIds) {
      toast.error(t('checkoutError'));
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: priceIds[plan][interval], quantity: 1 }],
      // Read back by the webhook to attach the subscription to this owner.
      customData: { ownerId: customer.ownerId },
      ...(customer.email ? { customer: { email: customer.email } } : {}),
      settings: {
        displayMode: 'overlay',
        locale: locale.startsWith('es') ? 'es' : 'en',
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        successUrl: `${window.location.origin}/app/billing?checkout=success`,
      },
    });
  }

  function confirmChange() {
    if (!pending) return;
    startTransition(async () => {
      const result = await changePlanAction({ plan: pending.plan, interval });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        pending.kind === 'interval'
          ? t('changedInterval', {
              plan: tp(`${pending.plan}.name`),
              interval: t(`intervalWord.${interval}`),
            })
          : t('changed', { plan: tp(`${pending.plan}.name`) }),
      );
      setPending(null);
      router.refresh();
    });
  }

  function actionFor(plan: Plan) {
    const isCurrentPrice = subscription
      ? subscription.plan === plan && subscription.interval === interval
      : plan === currentPlan;

    if (isCurrentPrice && !subscription?.cancelAtPeriodEnd) {
      return (
        <Button variant="outline" className="w-full" disabled>
          {t('current')}
        </Button>
      );
    }
    if (!isPaidPlan(plan)) {
      // Leaving a paid plan is a cancellation, which lives in Paddle's portal.
      return subscription ? (
        <p className="text-muted-foreground text-xs">{t('freeViaCancel')}</p>
      ) : null;
    }
    if (!subscription) {
      return (
        <Button
          className="w-full"
          disabled={!enabled || !paddle}
          onClick={() => openCheckout(plan)}
        >
          {t('subscribe', { plan: tp(`${plan}.name`) })}
        </Button>
      );
    }
    // Same plan, other billing interval: not a different plan, so it must not
    // read like one ("Switch to Business" while already on Business).
    if (subscription.plan === plan && !isCurrentPrice) {
      return (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            {interval === BillingInterval.YEAR
              ? t('toYearlyHint', {
                  monthly: formatUsd(PLANS[plan].price.MONTH),
                  savings: formatUsd(
                    PLANS[plan].price.MONTH * 12 - PLANS[plan].price.YEAR,
                  ),
                })
              : t('toMonthlyHint', {
                  yearly: formatUsd(PLANS[plan].price.YEAR),
                  annualized: formatUsd(PLANS[plan].price.MONTH * 12),
                })}
          </p>
          <Button
            className="w-full"
            variant={interval === BillingInterval.YEAR ? 'default' : 'outline'}
            disabled={!enabled}
            onClick={() => setPending({ plan, kind: 'interval' })}
          >
            {t('switchInterval', { interval: t(`intervalWord.${interval}`) })}
          </Button>
        </div>
      );
    }
    const kind: PendingChange['kind'] = isCurrentPrice ? 'resume' : 'change';
    const smaller =
      PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(subscription.plan);
    return (
      <Button
        className="w-full"
        variant={smaller ? 'outline' : 'default'}
        disabled={!enabled}
        onClick={() => setPending({ plan, kind })}
      >
        {kind === 'resume'
          ? t('resume', { plan: tp(`${plan}.name`) })
          : t('switchTo', { plan: tp(`${plan}.name`) })}
      </Button>
    );
  }

  const pendingLimit = pending ? PLANS[pending.plan].propertyLimit : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('choosePlan')}</h2>
        <IntervalToggle value={interval} onValueChange={setBillingInterval} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const isCurrent = plan === currentPlan;
          return (
            <div
              key={plan}
              className={cn(
                'bg-card flex flex-col rounded-xl border p-5',
                isCurrent && 'border-primary ring-primary/15 ring-4',
              )}
            >
              <h3 className="font-semibold">{tp(`${plan}.name`)}</h3>
              <p className="text-muted-foreground mt-1 min-h-10 text-sm">
                {tp(`${plan}.tagline`)}
              </p>
              <div className="mt-4">
                <PlanPrice plan={plan} interval={interval} />
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <Building2 className="text-primary size-4 shrink-0" />
                {tp('propertyLimit', { limit: PLANS[plan].propertyLimit })}
              </p>
              <div className="mt-auto pt-5">{actionFor(plan)}</div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => (open ? null : setPending(null))}
      >
        <DialogContent>
          {pending ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {pending.kind === 'interval'
                    ? t('confirmIntervalTitle', {
                        interval: t(`intervalWord.${interval}`),
                      })
                    : t('confirmTitle', { plan: tp(`${pending.plan}.name`) })}
                </DialogTitle>
                <DialogDescription>
                  {pending.kind === 'resume'
                    ? t('confirmResume')
                    : t('confirmChange')}
                </DialogDescription>
              </DialogHeader>
              {propertyCount > pendingLimit ? (
                <p className="text-warning text-sm">
                  {t('downgradeWarning', {
                    plan: tp(`${pending.plan}.name`),
                    limit: pendingLimit,
                    count: propertyCount,
                  })}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setPending(null)}
                  disabled={isPending}
                >
                  {t('cancel')}
                </Button>
                <Button onClick={confirmChange} loading={isPending}>
                  {t('confirm')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
