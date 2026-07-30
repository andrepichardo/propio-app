import 'server-only';
import {
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/shared/lib/prisma';
import { propertyRepository } from '@/features/properties/repositories/property.repository';
import { expenseRepository } from '@/features/expenses/repositories/expense.repository';
import { depositRepository } from '@/features/deposits/repositories/deposit.repository';
import {
  getUsdRates,
  makeConverter,
  type Converter,
} from '@/shared/lib/exchange-rates';

export type MonthlyReportRow = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  /** Per-point ≈ flags — set only when that month's figure was converted. */
  revenueApprox: boolean;
  expensesApprox: boolean;
};

export type YearlyReport = {
  year: number;
  totals: { revenue: number; expenses: number; profit: number };
  monthly: MonthlyReportRow[];
  categoryBreakdown: { label: string; value: number }[];
  occupancy: { occupied: number; available: number; maintenance: number };
  /** Per-metric ≈ flags: true only when that total combined a converted
   * (non-primary) currency. Single-currency totals stay exact. */
  approx: { revenue: boolean; expenses: boolean };
};

/** A converted total plus whether it combined any non-primary currency. */
type Summed = { total: number; approx: boolean };

function reduceGroups(
  groups: { currency: string; _sum: { amount: unknown } }[],
  convert: Converter,
  primary: string,
): Summed {
  let total = 0;
  let approx = false;
  for (const g of groups) {
    const amount = Number(g._sum.amount ?? 0);
    if (!amount) continue;
    total += convert(amount, g.currency);
    if (g.currency !== primary) approx = true;
  }
  return { total, approx };
}

async function sumInWindow(
  model: 'payment' | 'expense',
  ownerId: string,
  from: Date,
  to: Date,
  convert: Converter,
  primary: string,
): Promise<Summed> {
  if (model === 'payment') {
    // Revenue = rent + deposit the owner kept at settlement. A deposit while
    // held is a liability; only the retained part ever becomes income.
    const [groups, retained] = await Promise.all([
      prisma.payment.groupBy({
        by: ['currency'],
        where: {
          ownerId,
          deletedAt: null,
          status: PaymentStatus.COMPLETED,
          type: { not: PaymentType.DEPOSIT },
          paidAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      depositRepository.sumRetained(ownerId, from, to, convert, primary),
    ]);
    const rent = reduceGroups(groups, convert, primary);
    return {
      total: rent.total + retained.total,
      approx: rent.approx || retained.approx,
    };
  }
  const groups = await prisma.expense.groupBy({
    by: ['currency'],
    where: { ownerId, deletedAt: null, incurredAt: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return reduceGroups(groups, convert, primary);
}

/** Build a full-year financial + occupancy report for the owner. */
export async function getYearlyReport(
  ownerId: string,
  year: number,
  currency: string,
): Promise<YearlyReport> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  // Translate expense-category labels to the viewer's locale (request-scoped).
  const tCategory = await getTranslations('expenses.categories');
  // Live rates (cached ~24h); convert every amount to the primary currency.
  const convert = makeConverter(await getUsdRates(), currency);

  const [monthly, statusCounts, breakdown] = await Promise.all([
    Promise.all(
      months.map(async (monthDate) => {
        const from = startOfMonth(monthDate);
        const to = endOfMonth(monthDate);
        const [revenue, expenses] = await Promise.all([
          sumInWindow('payment', ownerId, from, to, convert, currency),
          sumInWindow('expense', ownerId, from, to, convert, currency),
        ]);
        return {
          month: format(monthDate, 'MMM'),
          revenue: revenue.total,
          expenses: expenses.total,
          profit: revenue.total - expenses.total,
          revenueApprox: revenue.approx,
          expensesApprox: expenses.approx,
        };
      }),
    ),
    propertyRepository.statusCounts(ownerId),
    expenseRepository.categoryBreakdown(ownerId, yearStart, yearEnd, convert),
  ]);

  const totals = monthly.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      expenses: acc.expenses + row.expenses,
      profit: acc.profit + row.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  // A yearly total is ≈ if any month's figure mixed a converted currency.
  const approx = {
    revenue: monthly.some((row) => row.revenueApprox),
    expenses: monthly.some((row) => row.expensesApprox),
  };

  return {
    year,
    totals,
    monthly,
    categoryBreakdown: breakdown
      .filter((row) => row.total > 0)
      .map((row) => ({
        label: tCategory(row.category),
        value: row.total,
      })),
    occupancy: {
      occupied: statusCounts.OCCUPIED,
      available: statusCounts.AVAILABLE,
      maintenance: statusCounts.MAINTENANCE,
    },
    approx,
  };
}
