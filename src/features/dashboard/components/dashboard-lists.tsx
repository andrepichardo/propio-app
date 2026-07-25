import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarClock,
  CircleDollarSign,
  FileSignature,
  History,
  PiggyBank,
} from 'lucide-react';
import type {
  DepositBreakdownItem,
  ExpiringContract,
  RecentActivityItem,
  UpcomingPayment,
} from '../services/dashboard.service';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { EmptyState } from '@/shared/components/empty-state';
import { formatCurrency, formatDate, formatRelative } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

export function UpcomingPaymentsCard({
  payments,
}: {
  payments: UpcomingPayment[];
}) {
  const t = useTranslations('dashboard');
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('upcomingPayments')}</CardTitle>
        <Link
          href="/app/payments"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="border-t px-6 pb-6">
            <EmptyState
              icon={CircleDollarSign}
              title={t('nothingDue')}
              description={t('nothingDueHint')}
              className="py-10"
            />
          </div>
        ) : (
          <ul className="divide-y border-t">
            {payments.map((payment) => (
              <li
                key={payment.contractId}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {payment.propertyName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {payment.tenantName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('due', { date: formatDate(payment.dueDate, 'MMM d') })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function DepositsHeldCard({
  total,
  currency,
  items,
  className,
}: {
  total: number;
  currency: string;
  items: DepositBreakdownItem[];
  className?: string;
}) {
  const t = useTranslations('dashboard');
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('depositsHeld')}</CardTitle>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PiggyBank className="size-[18px]" />
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <ul className="divide-y border-t">
          {items.map((item) => (
            <li
              key={`${item.propertyId}:${item.tenantId}`}
              className="flex items-center justify-between gap-3 px-6 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.property}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.tenant}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {formatCurrency(item.amount, currency)}
              </p>
            </li>
          ))}
        </ul>
        {/* Total only earns its own row once there's more than one holder. */}
        {items.length > 1 ? (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {t('depositsTotal')}
            </span>
            <span className="text-sm font-semibold">
              {formatCurrency(total, currency)}
            </span>
          </div>
        ) : null}
        <p className="mt-auto border-t px-6 py-3 text-xs text-muted-foreground">
          {t('depositsHeldHint')}
        </p>
      </CardContent>
    </Card>
  );
}

export function ExpiringContractsCard({
  contracts,
}: {
  contracts: ExpiringContract[];
}) {
  const t = useTranslations('dashboard');
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('expiringContracts')}</CardTitle>
        <Link
          href="/app/contracts"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {contracts.length === 0 ? (
          <div className="border-t px-6 pb-6">
            <EmptyState
              icon={FileSignature}
              title={t('noExpirations')}
              className="py-10"
            />
          </div>
        ) : (
          <ul className="divide-y border-t">
            {contracts.map((contract) => (
              <li
                key={contract.contractId}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {contract.propertyName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contract.tenantName}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-warning">
                  <CalendarClock className="size-3.5" />
                  {formatDate(contract.endDate, 'MMM d')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentActivityCard({
  activity,
}: {
  activity: RecentActivityItem[];
}) {
  const t = useTranslations('dashboard');
  const tActivity = useTranslations('activity');
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activity.length === 0 ? (
          <div className="border-t px-6 pb-6">
            <EmptyState
              icon={History}
              title={t('noActivity')}
              description={t('noActivityHint')}
              className="py-10"
            />
          </div>
        ) : (
          <ul className="space-y-4 border-t px-6 pb-6 pt-4">
            {activity.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/60" />
                <div className="min-w-0">
                  {/* Rows recorded before i18n only carry the English summary. */}
                  <p className="text-sm">
                    {item.messageKey && tActivity.has(item.messageKey)
                      ? tActivity(item.messageKey, item.params)
                      : item.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(item.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
