import 'server-only';
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  ContractStatus,
  PaymentStatus,
  PropertyStatus,
} from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { propertyRepository } from '@/features/properties/repositories/property.repository';
import { toNumber } from '@/shared/lib/format';

export type DashboardSummary = {
  properties: { total: number; occupied: number; available: number; maintenance: number };
  finance: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    revenueTrendPct: number;
  };
  occupancyRate: number;
  monthlySeries: { month: string; revenue: number; expenses: number }[];
  upcomingPayments: UpcomingPayment[];
  expiringContracts: ExpiringContract[];
  recentActivity: RecentActivityItem[];
};

export type UpcomingPayment = {
  contractId: string;
  propertyName: string;
  tenantName: string;
  amount: number;
  currency: string;
  dueDate: Date;
};

export type ExpiringContract = {
  contractId: string;
  propertyName: string;
  tenantName: string;
  endDate: Date;
};

export type RecentActivityItem = {
  id: string;
  /** Legacy English text; fallback for rows recorded before i18n. */
  summary: string;
  action: string;
  createdAt: Date;
  /** `activity` namespace key + params for locale-aware rendering. */
  messageKey?: string;
  params?: Record<string, string>;
};

/** Sum completed payments within an inclusive date window. */
async function sumPayments(
  ownerId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      ownerId,
      deletedAt: null,
      status: PaymentStatus.COMPLETED,
      paidAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount?.toString());
}

async function sumExpenses(
  ownerId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const result = await prisma.expense.aggregate({
    where: {
      ownerId,
      deletedAt: null,
      incurredAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount?.toString());
}

/** Build the last 6 months of revenue vs expenses for the trend chart. */
async function buildMonthlySeries(
  ownerId: string,
): Promise<{ month: string; revenue: number; expenses: number }[]> {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) =>
    startOfMonth(subMonths(now, 5 - i)),
  );

  return Promise.all(
    months.map(async (start) => {
      const end = endOfMonth(start);
      const [revenue, expenses] = await Promise.all([
        sumPayments(ownerId, start, end),
        sumExpenses(ownerId, start, end),
      ]);
      return { month: format(start, 'MMM'), revenue, expenses };
    }),
  );
}

/**
 * Compute the next due date for a contract from its `dueDay`, relative to now.
 */
function nextDueDate(dueDay: number, reference = new Date()): Date {
  const day = Math.min(Math.max(dueDay, 1), 28);
  const thisMonth = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    day,
  );
  return thisMonth >= reference ? thisMonth : addMonths(thisMonth, 1);
}

/**
 * Month bucket a payment counts toward: its rent period, else when paid.
 * Date-only values (periodStart, form-picked paidAt) live at UTC midnight;
 * reading them with local getters west of UTC would land on the previous
 * month at month boundaries, so those use their UTC parts.
 */
function monthKey(date: Date): string {
  const isUtcMidnight = date.getTime() % 86_400_000 === 0;
  const year = isUtcMidnight ? date.getUTCFullYear() : date.getFullYear();
  const month = isUtcMidnight ? date.getUTCMonth() : date.getMonth();
  return `${year}-${month}`;
}

export async function getDashboardSummary(
  ownerId: string,
): Promise<DashboardSummary> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));
  const soon = addMonths(now, 1);

  const [
    statusCounts,
    monthlyRevenue,
    prevRevenue,
    monthlyExpenses,
    monthlySeries,
    activeContracts,
    expiring,
    activity,
  ] = await Promise.all([
    propertyRepository.statusCounts(ownerId),
    sumPayments(ownerId, monthStart, monthEnd),
    sumPayments(ownerId, prevStart, prevEnd),
    sumExpenses(ownerId, monthStart, monthEnd),
    buildMonthlySeries(ownerId),
    prisma.contract.findMany({
      where: { ownerId, deletedAt: null, status: ContractStatus.ACTIVE },
      select: {
        id: true,
        monthlyRent: true,
        currency: true,
        dueDay: true,
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.contract.findMany({
      where: {
        ownerId,
        deletedAt: null,
        status: ContractStatus.ACTIVE,
        endDate: { gte: now, lte: soon },
      },
      orderBy: { endDate: 'asc' },
      take: 5,
      select: {
        id: true,
        endDate: true,
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.activity.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        summary: true,
        action: true,
        createdAt: true,
        metadata: true,
      },
    }),
  ]);

  const totalProperties =
    statusCounts[PropertyStatus.AVAILABLE] +
    statusCounts[PropertyStatus.OCCUPIED] +
    statusCounts[PropertyStatus.MAINTENANCE];

  const occupancyRate =
    totalProperties > 0
      ? statusCounts[PropertyStatus.OCCUPIED] / totalProperties
      : 0;

  const revenueTrendPct =
    prevRevenue > 0
      ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100
      : monthlyRevenue > 0
        ? 100
        : 0;

  // Payments already recorded around the current period, bucketed per
  // contract+month, so paid rents drop out of "upcoming payments".
  const recentPayments = await prisma.payment.findMany({
    where: {
      ownerId,
      deletedAt: null,
      status: PaymentStatus.COMPLETED,
      contractId: { in: activeContracts.map((c) => c.id) },
      paidAt: { gte: subMonths(monthStart, 1) },
    },
    select: { contractId: true, amount: true, paidAt: true, periodStart: true },
  });
  const paidByContractMonth = new Map<string, number>();
  for (const payment of recentPayments) {
    const key = `${payment.contractId}:${monthKey(payment.periodStart ?? payment.paidAt)}`;
    paidByContractMonth.set(
      key,
      (paidByContractMonth.get(key) ?? 0) + toNumber(payment.amount.toString()),
    );
  }

  const upcomingPayments: UpcomingPayment[] = activeContracts
    .map((contract) => {
      const rent = toNumber(contract.monthlyRent.toString());
      // Skip due dates whose month is already covered by recorded payments
      // (a single payment may bundle rent + deposits, hence >= rent).
      let dueDate = nextDueDate(contract.dueDay, now);
      for (let i = 0; i < 3; i++) {
        const paid =
          paidByContractMonth.get(`${contract.id}:${monthKey(dueDate)}`) ?? 0;
        if (paid < rent) break;
        dueDate = addMonths(dueDate, 1);
      }
      return {
        contractId: contract.id,
        propertyName: contract.property.name,
        tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
        amount: rent,
        currency: contract.currency,
        dueDate,
      };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return {
    properties: {
      total: totalProperties,
      occupied: statusCounts[PropertyStatus.OCCUPIED],
      available: statusCounts[PropertyStatus.AVAILABLE],
      maintenance: statusCounts[PropertyStatus.MAINTENANCE],
    },
    finance: {
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      revenueTrendPct,
    },
    occupancyRate,
    monthlySeries,
    upcomingPayments,
    expiringContracts: expiring
      .filter((c) => c.endDate)
      .map((c) => ({
        contractId: c.id,
        propertyName: c.property.name,
        tenantName: `${c.tenant.firstName} ${c.tenant.lastName}`,
        endDate: c.endDate as Date,
      })),
    recentActivity: activity.map((item) => {
      const meta = item.metadata as {
        key?: unknown;
        params?: Record<string, string>;
      } | null;
      return {
        id: item.id,
        summary: item.summary,
        action: item.action,
        createdAt: item.createdAt,
        messageKey: typeof meta?.key === 'string' ? meta.key : undefined,
        params: meta?.params,
      };
    }),
  };
}
