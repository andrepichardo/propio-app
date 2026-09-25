import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { clientEnv } from '@/shared/config/env';
import { PageHeader } from '@/shared/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { billingService } from '@/features/billing/services/billing.service';
import { PlanPicker } from '@/features/billing/components/plan-picker';
import { ManageSubscriptionButton } from '@/features/billing/components/manage-subscription-button';
import { CheckoutProcessing } from '@/features/billing/components/checkout-processing';
import { PeriodEndLine } from '@/features/billing/components/period-end-line';
import { isPaidPlan } from '@/features/billing/plans';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('billing') };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireUser();
  const [overview, { checkout }, t, tp, tf] = await Promise.all([
    billingService.overview(user.id),
    searchParams,
    getTranslations('billing'),
    getTranslations('plans'),
    getTranslations('landing.faq'),
  ]);

  const { plan, subscription } = overview;
  const contactEmail = tf('email');
  const awaitingWebhook = checkout === 'success' && !subscription;
  const usagePct = Math.min(
    100,
    Math.round((overview.propertyCount / overview.propertyLimit) * 100),
  );
  const overLimit = overview.propertyCount > overview.propertyLimit;

  let statusLine: React.ReactNode = null;
  if (subscription?.status === 'past_due') {
    statusLine = t('pastDue');
  } else if (subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
    statusLine = (
      <PeriodEndLine
        kind="cancelsOn"
        periodEnd={subscription.currentPeriodEnd.toISOString()}
      />
    );
  } else if (subscription?.currentPeriodEnd) {
    statusLine = (
      <PeriodEndLine
        kind="renewsOn"
        periodEnd={subscription.currentPeriodEnd.toISOString()}
      />
    );
  } else if (
    overview.compPlan &&
    overview.compPlan === plan &&
    isPaidPlan(plan)
  ) {
    statusLine = t('comp');
  }

  const paddleConfig = clientEnv.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    ? {
        token: clientEnv.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: clientEnv.NEXT_PUBLIC_PADDLE_ENV,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {awaitingWebhook ? <CheckoutProcessing email={contactEmail} /> : null}
      {!overview.configured ? (
        <p className="bg-muted/50 text-muted-foreground rounded-lg border p-4 text-sm">
          {t('notConfigured')}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-sm">{t('currentPlan')}</p>
            <CardTitle className="text-2xl">{tp(`${plan}.name`)}</CardTitle>
            {statusLine ? (
              <p
                className={
                  subscription?.status === 'past_due'
                    ? 'text-destructive text-sm'
                    : 'text-muted-foreground text-sm'
                }
              >
                {statusLine}
              </p>
            ) : null}
          </div>
          {overview.hasBillingAccount && overview.configured ? (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              {/* Without a live subscription the portal only holds past
                  invoices and refunds, so the button must not promise a
                  subscription to manage next to "Current plan: Free". */}
              <ManageSubscriptionButton
                label={subscription ? t('manage') : t('pastPayments')}
              />
              <p className="text-muted-foreground text-xs">
                {subscription ? t('manageHint') : t('pastPaymentsHint')}
              </p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t('usageLabel')}</span>
            <span className="text-muted-foreground tabular-nums">
              {t('usage', {
                count: overview.propertyCount,
                limit: overview.propertyLimit,
              })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={overview.propertyLimit}
            aria-valuenow={overview.propertyCount}
            className="bg-muted h-2 overflow-hidden rounded-full"
          >
            <div
              className={
                overview.canAddProperty
                  ? 'bg-primary h-full'
                  : 'bg-warning h-full'
              }
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {overLimit ? (
            <p className="text-warning text-sm">
              {t('overLimit', {
                count: overview.propertyCount,
                limit: overview.propertyLimit,
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <PlanPicker
        plan={plan}
        subscription={
          subscription
            ? {
                plan: subscription.plan,
                interval: subscription.interval,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              }
            : null
        }
        propertyCount={overview.propertyCount}
        priceIds={overview.configured ? overview.priceIds : null}
        paddleConfig={overview.configured ? paddleConfig : null}
        customer={{ ownerId: user.id, email: user.email ?? null }}
      />

      <div className="text-muted-foreground space-y-1 text-center text-xs">
        <p>{t('largePortfolio', { email: contactEmail })}</p>
        <p>{t('poweredBy')}</p>
      </div>
    </div>
  );
}
