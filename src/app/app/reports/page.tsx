import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoorOpen, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { requireUser } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { getYearlyReport } from '@/features/reports/services/report.service';
import {
  ExpenseBreakdownChart,
  ProfitBarChart,
} from '@/features/reports/components/report-charts';
import { YearSelector } from '@/features/reports/components/year-selector';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { formatCurrency, formatPercent } from '@/shared/lib/format';

export const metadata: Metadata = { title: 'Reports' };

async function ReportContent({
  ownerId,
  currency,
  year,
}: {
  ownerId: string;
  currency: string;
  year: number;
}) {
  const report = await getYearlyReport(ownerId, year);
  const totalUnits =
    report.occupancy.occupied +
    report.occupancy.available +
    report.occupancy.maintenance;
  const occupancyRate =
    totalUnits > 0 ? report.occupancy.occupied / totalUnits : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Revenue ${year}`}
          value={formatCurrency(report.totals.revenue, currency)}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label={`Expenses ${year}`}
          value={formatCurrency(report.totals.expenses, currency)}
          icon={TrendingDown}
          accent="warning"
        />
        <StatCard
          label={`Net profit ${year}`}
          value={formatCurrency(report.totals.profit, currency)}
          icon={Wallet}
          accent={report.totals.profit >= 0 ? 'default' : 'destructive'}
        />
        <StatCard
          label="Occupancy"
          value={formatPercent(occupancyRate)}
          icon={DoorOpen}
          hint={`${report.occupancy.occupied}/${totalUnits} occupied`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs expenses</CardTitle>
            <CardDescription>Monthly, {year}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitBarChart data={report.monthly} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by category</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart
              data={report.categoryBreakdown}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const { currency } = await getUserPreferences(user.id);
  const { year } = await searchParams;
  const selectedYear = Number(year) || new Date().getFullYear();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial performance across your portfolio."
        actions={<YearSelector selectedYear={selectedYear} />}
      />
      <Suspense
        key={selectedYear}
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }
      >
        <ReportContent
          ownerId={user.id}
          currency={currency}
          year={selectedYear}
        />
      </Suspense>
    </div>
  );
}
