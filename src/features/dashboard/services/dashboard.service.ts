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
  PaymentType,
  PropertyStatus,
} from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { propertyRepository } from '@/features/properties/repositories/property.repository';
import { depositRepository } from '@/features/deposits/repositories/deposit.repository';
import { toNumber } from '@/shared/lib/format';
import {
  getUsdRates,
  makeConverter,
  type Converter,
} from '@/shared/lib/exchange-rates';

export type DashboardSummary = {
  properties: { total: number; occupied: number; available: number; maintenance: number };
  finance: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    revenueTrendPct: number;
    /** Deposits currently held on behalf of tenants (a liability). */
    depositsHeld: number;
    /** Per-metric ≈ flags: true only when that total combined a converted
     * (non-primary) currency. Single-currency totals stay exact. */
    revenueApprox: boolean;
    expensesApprox: boolean;
  };
  occupancyRate: number;
  monthlySeries: {
    month: string;
    revenue: number;
    expenses: number;
    /** Per-point ≈ flags — set only when that month's figure was converted. */
    revenueApprox: boolean;
    expensesApprox: boolean;
  }[];
  upcomingPayments: UpcomingPayment[];
  /** Held deposits per tenant/property, so the total can be itemised. */
  depositsBreakdown: DepositBreakdownItem[];
  expiringContracts: ExpiringContract[];
  recentActivity: RecentActivityItem[];
};

export type DepositBreakdownItem = {
  propertyId: string;
  tenantId: string;
  property: string;
  tenant: string;
  /** Original held amount, in its own currency (not converted). */
  amount: number;
  currency: string;
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
/** A converted total plus whether it combined any non-primary currency. */
type Summed = { total: number; approx: boolean };

/** Sum groupBy-currency rows, converting each; flag if any is non-primary. */
function reduceGroups(
  groups: { currency: string; _sum: { amount: unknown } }[],
  convert: Converter,
  primary: string,
): Summed {
  let total = 0;
  let approx = false;
  for (const g of groups) {
    const amount = toNumber(String(g._sum.amount ?? ''));
    if (!amount) continue;
    total += convert(amount, g.currency);
    if (g.currency !== primary) approx = true;
  }
  return { total, approx };
}

async function sumPayments(
  ownerId: string,
  from: Date,
  to: Date,
  convert: Converter,
  primary: string,
): Promise<Summed> {
  const groups = await prisma.payment.groupBy({
    by: ['currency'],
    where: {
      ownerId,
      deletedAt: null,
      status: PaymentStatus.COMPLETED,
      // Deposits are a liability, not income — keep them out of revenue.
      type: { not: PaymentType.DEPOSIT },
      paidAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });
  return reduceGroups(groups, convert, primary);
}

/**
 * Revenue for a window: rent plus any deposit the owner kept at settlement
 * (retained deposit stops being a liability and becomes income on that date).
 */
async function sumRevenue(
  ownerId: string,
  from: Date,
  to: Date,
  convert: Converter,
  primary: string,
): Promise<Summed> {
  const [rent, retained] = await Promise.all([
    sumPayments(ownerId, from, to, convert, primary),
    depositRepository.sumRetained(ownerId, from, to, convert, primary),
  ]);
  return {
    total: rent.total + retained.total,
    approx: rent.approx || retained.approx,
  };
}

async function sumExpenses(
  ownerId: string,
  from: Date,
  to: Date,
  convert: Converter,
  primary: string,
): Promise<Summed> {
  const groups = await prisma.expense.groupBy({
    by: ['currency'],
    where: {
      ownerId,
      deletedAt: null,
      incurredAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });
  return reduceGroups(groups, convert, primary);
}

/** Build the last 6 months of revenue vs expenses for the trend chart. Each
 * point carries its own ≈ flags so a tooltip marks a value only when THAT
 * month's figure mixed a converted currency. */
async function buildMonthlySeries(
  ownerId: string,
  convert: Converter,
  primary: string,
): Promise<
  {
    month: string;
    revenue: number;
    expenses: number;
    revenueApprox: boolean;
    expensesApprox: boolean;
  }[]
> {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) =>
    startOfMonth(subMonths(now, 5 - i)),
  );

  return Promise.all(
    months.map(async (start) => {
      const end = endOfMonth(start);
      const [revenue, expenses] = await Promise.all([
        sumRevenue(ownerId, start, end, convert, primary),
        sumExpenses(ownerId, start, end, convert, primary),
      ]);
      return {
        month: format(start, 'MMM'),
        revenue: revenue.total,
        expenses: expenses.total,
        revenueApprox: revenue.approx,
        expensesApprox: expenses.approx,
      };
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
  currency: string,
): Promise<DashboardSummary> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));
  const soon = addMonths(now, 1);

  // Live rates (cached ~24h); convert every amount to the primary currency.
  const convert = makeConverter(await getUsdRates(), currency);

  const [
    statusCounts,
    monthlyRevenue,
    prevRevenue,
    monthlyExpenses,
    depositsBreakdown,
    monthly,
    activeContracts,
    expiring,
    activity,
  ] = await Promise.all([
    propertyRepository.statusCounts(ownerId),
    sumRevenue(ownerId, monthStart, monthEnd, convert, currency),
    sumRevenue(ownerId, prevStart, prevEnd, convert, currency),
    sumExpenses(ownerId, monthStart, monthEnd, convert, currency),
    depositRepository.heldBreakdown(ownerId),
    buildMonthlySeries(ownerId, convert, currency),
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
      // All expiring within the window; the card caps the height and scrolls.
      orderBy: { endDate: 'asc' },
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
    prevRevenue.total > 0
      ? ((monthlyRevenue.total - prevRevenue.total) / prevRevenue.total) * 100
      : monthlyRevenue.total > 0
        ? 100
        : 0;

  // Payments already recorded around the current period, bucketed per
  // contract+month, so paid rents drop out of "upcoming payments".
  const recentPayments = await prisma.payment.findMany({
    where: {
      ownerId,
      deletedAt: null,
      status: PaymentStatus.COMPLETED,
      // Only rent payments settle a month's due rent; deposits don't.
      type: { not: PaymentType.DEPOSIT },
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
      // Skip due dates whose month is already covered by recorded rent
      // payments (an overpayment can exceed the month's rent, hence >=).
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
      monthlyRevenue: monthlyRevenue.total,
      monthlyExpenses: monthlyExpenses.total,
      netProfit: monthlyRevenue.total - monthlyExpenses.total,
      revenueTrendPct,
      // Each held deposit keeps its own currency; only the total is converted.
      depositsHeld: depositsBreakdown.reduce(
        (sum, d) => sum + convert(d.amount, d.currency),
        0,
      ),
      revenueApprox: monthlyRevenue.approx,
      expensesApprox: monthlyExpenses.approx,
    },
    occupancyRate,
    monthlySeries: monthly,
    upcomingPayments,
    depositsBreakdown,
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
