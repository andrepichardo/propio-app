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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total properties"
          value={String(summary.properties.total)}
          icon={Building2}
          hint={`${summary.properties.occupied} occupied · ${summary.properties.available} available`}
        />
        <StatCard
          label="Occupancy rate"
          value={formatPercent(summary.occupancyRate)}
          icon={DoorOpen}
          accent="success"
          hint={`${summary.properties.maintenance} in maintenance`}
        />
        <StatCard
          label="Monthly revenue"
          value={formatCurrency(summary.finance.monthlyRevenue, currency)}
          icon={TrendingUp}
          trend={summary.finance.revenueTrendPct}
          accent="success"
        />
        <StatCard
          label="Net profit"
          value={formatCurrency(summary.finance.netProfit, currency)}
          icon={summary.finance.netProfit >= 0 ? Wallet : TrendingDown}
          accent={summary.finance.netProfit >= 0 ? 'default' : 'destructive'}
          hint={`${formatCurrency(summary.finance.monthlyExpenses, currency)} expenses`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={summary.monthlySeries} currency={currency} />
          </CardContent>
        </Card>
        <UpcomingPaymentsCard payments={summary.upcomingPayments} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpiringContractsCard contracts={summary.expiringContracts} />
        <RecentActivityCard activity={summary.recentActivity} />
      </div>
    </div>
  );
}
