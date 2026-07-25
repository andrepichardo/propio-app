import { getTranslations } from 'next-intl/server';
import {
  Building2,
  DoorOpen,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getDashboardSummary } from '../services/dashboard.service';
import { RevenueChart } from './revenue-chart';
import {
  DepositsHeldCard,
  ExpiringContractsCard,
  RecentActivityCard,
  UpcomingPaymentsCard,
} from './dashboard-lists';
import { StatCard } from '@/shared/components/stat-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { formatCurrency, formatPercent } from '@/shared/lib/format';

/**
 * Server component that loads the full dashboard summary and composes the KPI
 * grid, trend chart and activity lists. Fetched inside a Suspense boundary on
 * the page so the shell renders instantly.
 */
export async function DashboardOverview({
  ownerId,
  currency,
}: {
  ownerId: string;
  currency: string;
}) {
  const summary = await getDashboardSummary(ownerId);
  const t = await getTranslations('dashboard');

  const hasDeposits = summary.finance.depositsHeld > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('totalProperties')}
          value={String(summary.properties.total)}
          icon={Building2}
          hint={t('occupiedAvailable', {
            occupied: summary.properties.occupied,
            available: summary.properties.available,
          })}
        />
        <StatCard
          label={t('occupancyRate')}
          value={formatPercent(summary.occupancyRate)}
          icon={DoorOpen}
          accent="success"
          hint={t('inMaintenance', { count: summary.properties.maintenance })}
        />
        <StatCard
          label={t('monthlyRevenue')}
          value={formatCurrency(summary.finance.monthlyRevenue, currency)}
          icon={TrendingUp}
          trend={summary.finance.revenueTrendPct}
          accent="success"
        />
        <StatCard
          label={t('netProfit')}
          value={formatCurrency(summary.finance.netProfit, currency)}
          icon={summary.finance.netProfit >= 0 ? Wallet : TrendingDown}
          accent={summary.finance.netProfit >= 0 ? 'default' : 'destructive'}
          hint={t('expensesHint', {
            amount: formatCurrency(summary.finance.monthlyExpenses, currency),
          })}
        />
      </div>

      {/* The chart has a fixed height on lg; the right column matches it and
          splits into two equal halves that each scroll. items-start keeps the
          chart from being stretched by anything taller beside it. */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col lg:h-[26rem]">
          <CardHeader>
            <CardTitle className="text-base">
              {t('revenueVsExpenses')}
            </CardTitle>
            <CardDescription>{t('last6Months')}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <RevenueChart data={summary.monthlySeries} currency={currency} />
          </CardContent>
        </Card>
        {hasDeposits ? (
          <div className="flex flex-col gap-6 lg:grid lg:h-[26rem] lg:grid-rows-2">
            {/* Capped on mobile too so a long list doesn't run down the page;
                on lg the grid-rows-2 height takes over (max-h-none). */}
            <UpcomingPaymentsCard
              className="max-h-80 lg:max-h-none lg:min-h-0"
              payments={summary.upcomingPayments}
            />
            <DepositsHeldCard
              className="max-h-80 lg:max-h-none lg:min-h-0"
              total={summary.finance.depositsHeld}
              currency={currency}
              items={summary.depositsBreakdown}
            />
          </div>
        ) : (
          <UpcomingPaymentsCard payments={summary.upcomingPayments} />
        )}
      </div>

      {/* Fixed, equal height on lg so both cards line up; each scrolls its own
          list. Capped (not fixed) on mobile so they don't run down the page. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpiringContractsCard
          className="max-h-[22rem] lg:h-[22rem]"
          contracts={summary.expiringContracts}
        />
        <RecentActivityCard
          className="max-h-[22rem] lg:h-[22rem]"
          activity={summary.recentActivity}
        />
      </div>
    </div>
  );
}
