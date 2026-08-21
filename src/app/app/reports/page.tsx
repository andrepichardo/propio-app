import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { DoorOpen, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { requireUser } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { getYearlyReport } from '@/features/reports/services/report.service';
import {
  ExpenseBreakdownChart,
  ProfitBarChart,
} from '@/features/reports/components/report-charts';
import { YearSelector } from '@/features/reports/components/year-selector';
import { ReportsDataSkeleton } from '@/features/reports/components/reports-skeleton';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { RatesUnavailableNotice } from '@/shared/components/rates-unavailable-notice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { formatCurrency, formatPercent } from '@/shared/lib/format';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('reports') };
}

async function ReportContent({
  ownerId,
  currency,
  year,
}: {
  ownerId: string;
  currency: string;
  year: number;
}) {
  const report = await getYearlyReport(ownerId, year, currency);
  const t = await getTranslations('reports');
  const totalUnits =
    report.occupancy.occupied +
    report.occupancy.available +
    report.occupancy.maintenance;
  const occupancyRate =
    totalUnits > 0 ? report.occupancy.occupied / totalUnits : 0;
  // Per-metric ≈: only when that specific total mixed a converted currency.
  const revApprox = report.approx.revenue ? '≈ ' : '';
  const expApprox = report.approx.expenses ? '≈ ' : '';
  const netApprox = report.approx.revenue || report.approx.expenses ? '≈ ' : '';

  return (
    <div className="space-y-6">
      {report.ratesUnavailable ? <RatesUnavailableNotice /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('revenue', { year })}
          value={`${revApprox}${formatCurrency(report.totals.revenue, currency)}`}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label={t('expensesTotal', { year })}
          value={`${expApprox}${formatCurrency(report.totals.expenses, currency)}`}
          icon={TrendingDown}
          accent="warning"
        />
        <StatCard
          label={t('netProfit', { year })}
          value={`${netApprox}${formatCurrency(report.totals.profit, currency)}`}
          icon={Wallet}
          accent={report.totals.profit >= 0 ? 'default' : 'destructive'}
        />
        <StatCard
          label={t('occupancy')}
          value={formatPercent(occupancyRate)}
          icon={DoorOpen}
          hint={t('occupiedOf', {
            occupied: report.occupancy.occupied,
            total: totalUnits,
          })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('revenueVsExpenses')}
            </CardTitle>
            <CardDescription>{t('monthlyYear', { year })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitBarChart data={report.monthly} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('expensesByCategory')}
            </CardTitle>
            <CardDescription>{t('whereMoneyGoes')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart
              data={report.categoryBreakdown}
              currency={currency}
              approx={report.approx.expenses}
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
  const t = await getTranslations('reports');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={<YearSelector selectedYear={selectedYear} />}
      />
      <Suspense key={selectedYear} fallback={<ReportsDataSkeleton />}>
        <ReportContent
          ownerId={user.id}
          currency={currency}
          year={selectedYear}
        />
      </Suspense>
    </div>
  );
}
