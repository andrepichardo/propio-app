import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarClock,
  CircleDollarSign,
  FileSignature,
  History,
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
import { formatCurrency, formatRelative } from '@/shared/lib/format';
import type { DateFormatter } from '@/shared/lib/date-format';
import { cn } from '@/shared/lib/utils';

export function UpcomingPaymentsCard({
  payments,
  formatDate,
  className,
}: {
  payments: UpcomingPayment[];
  formatDate: DateFormatter;
  className?: string;
}) {
  const t = useTranslations('dashboard');
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('upcomingPayments')}</CardTitle>
        <Link
          href="/app/payments"
          className="text-primary text-xs font-medium hover:underline"
        >
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {payments.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center border-t p-6">
            <EmptyState
              icon={CircleDollarSign}
              title={t('nothingDue')}
              description={t('nothingDueHint')}
            />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y overflow-y-auto border-t">
            {payments.map((payment) => (
              <li
                key={payment.contractId}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {payment.propertyName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {payment.tenantName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('due', { date: formatDate(payment.dueDate) })}
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
  ratesUnavailable = false,
  className,
}: {
  total: number;
  currency: string;
  items: DepositBreakdownItem[];
  /** No rates were available, so the total was summed unconverted. */
  ratesUnavailable?: boolean;
  className?: string;
}) {
  const t = useTranslations('dashboard');
  // The total is converted to the primary currency; mark it ≈ only when a
  // deposit is held in another currency AND the conversion actually happened.
  // Without rates the amounts were added raw, which the page-level notice
  // reports — a ≈ here would quietly pass that off as a rounding difference.
  const approx =
    !ratesUnavailable && items.some((item) => item.currency !== currency);
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      {/* Total lives in the header so the scrolling list gets the full body. */}
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('depositsHeld')}</CardTitle>
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold">
            {approx ? '≈ ' : ''}
            {formatCurrency(total, currency)}
          </p>
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t('depositsTotal')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto border-t">
          {items.map((item) => (
            <li
              key={`${item.propertyId}:${item.tenantId}`}
              className="flex items-center justify-between gap-3 px-6 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.property}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {item.tenant}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {formatCurrency(item.amount, item.currency)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ExpiringContractsCard({
  contracts,
  formatDate,
  className,
}: {
  contracts: ExpiringContract[];
  formatDate: DateFormatter;
  className?: string;
}) {
  const t = useTranslations('dashboard');
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-base">{t('expiringContracts')}</CardTitle>
        <Link
          href="/app/contracts"
          className="text-primary text-xs font-medium hover:underline"
        >
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {contracts.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center border-t p-6">
            <EmptyState icon={FileSignature} title={t('noExpirations')} />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y overflow-y-auto border-t">
            {contracts.map((contract) => (
              <li key={contract.contractId}>
                <Link
                  href={`/app/contracts/${contract.contractId}`}
                  className="hover:bg-muted/50 flex items-center justify-between gap-3 px-6 py-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {contract.propertyName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {contract.tenantName}
                    </p>
                  </div>
                  <span className="text-warning inline-flex shrink-0 items-center gap-1 text-xs">
                    <CalendarClock className="size-3.5" />
                    {formatDate(contract.endDate)}
                  </span>
                </Link>
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
  className,
}: {
  activity: RecentActivityItem[];
  className?: string;
}) {
  const t = useTranslations('dashboard');
  const tActivity = useTranslations('activity');
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="py-4">
        <CardTitle className="text-base">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {activity.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center border-t p-6">
            <EmptyState
              icon={History}
              title={t('noActivity')}
              description={t('noActivityHint')}
            />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto border-t px-6 pt-4 pb-6">
            {activity.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="bg-primary/60 mt-1.5 size-2 shrink-0 rounded-full" />
                <div className="min-w-0">
                  {/* Rows recorded before i18n only carry the English summary. */}
                  <p className="text-sm">
                    {item.messageKey && tActivity.has(item.messageKey)
                      ? tActivity(item.messageKey, item.params)
                      : item.summary}
                  </p>
                  <p className="text-muted-foreground text-xs">
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
