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

export type MonthlyReportRow = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type YearlyReport = {
  year: number;
  totals: { revenue: number; expenses: number; profit: number };
  monthly: MonthlyReportRow[];
  categoryBreakdown: { label: string; value: number }[];
  occupancy: { occupied: number; available: number; maintenance: number };
};

async function sumInWindow(
  model: 'payment' | 'expense',
  ownerId: string,
  from: Date,
  to: Date,
): Promise<number> {
  if (model === 'payment') {
    // Revenue = rent + deposit the owner kept at settlement. A deposit while
    // held is a liability; only the retained part ever becomes income.
    const [r, retained] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ownerId,
          deletedAt: null,
          status: PaymentStatus.COMPLETED,
          type: { not: PaymentType.DEPOSIT },
          paidAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      depositRepository.sumRetained(ownerId, from, to),
    ]);
    return Number(r._sum.amount ?? 0) + retained;
  }
  const r = await prisma.expense.aggregate({
    where: { ownerId, deletedAt: null, incurredAt: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return Number(r._sum.amount ?? 0);
}

/** Build a full-year financial + occupancy report for the owner. */
export async function getYearlyReport(
  ownerId: string,
  year: number,
): Promise<YearlyReport> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  // Translate expense-category labels to the viewer's locale (request-scoped).
  const tCategory = await getTranslations('expenses.categories');

  const [monthly, statusCounts, breakdown] = await Promise.all([
    Promise.all(
      months.map(async (monthDate) => {
        const from = startOfMonth(monthDate);
        const to = endOfMonth(monthDate);
        const [revenue, expenses] = await Promise.all([
          sumInWindow('payment', ownerId, from, to),
          sumInWindow('expense', ownerId, from, to),
        ]);
        return {
          month: format(monthDate, 'MMM'),
          revenue,
          expenses,
          profit: revenue - expenses,
        };
      }),
    ),
    propertyRepository.statusCounts(ownerId),
    expenseRepository.categoryBreakdown(ownerId, yearStart, yearEnd),
  ]);

  const totals = monthly.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      expenses: acc.expenses + row.expenses,
      profit: acc.profit + row.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

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
  };
}
