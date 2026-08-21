import 'server-only';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  startOfMonth,
  subDays,
} from 'date-fns';
import {
  ContractStatus,
  NotificationType,
  PaymentStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/shared/lib/prisma';
import { formatCurrency } from '@/shared/lib/format';

/** Fallback reminder settings for owners whose row is somehow missing. Mirrors
 * the Prisma `User` column defaults. */
const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  notifyContractExpiring: true,
  contractExpiringLeadDays: 30,
  notifyPaymentUpcoming: true,
  paymentUpcomingLeadDays: 3,
  notifyPaymentLate: true,
};

type ReminderPrefs = {
  notifyContractExpiring: boolean;
  contractExpiringLeadDays: number;
  notifyPaymentUpcoming: boolean;
  paymentUpcomingLeadDays: number;
  notifyPaymentLate: boolean;
};

/** Per-owner reminder settings, keyed by owner id. */
async function loadReminderPrefs(): Promise<Map<string, ReminderPrefs>> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      notifyContractExpiring: true,
      contractExpiringLeadDays: true,
      notifyPaymentUpcoming: true,
      paymentUpcomingLeadDays: true,
      notifyPaymentLate: true,
    },
  });
  return new Map(users.map(({ id, ...prefs }) => [id, prefs]));
}

/** Skip if an identical reminder was already created within the window. */
async function alreadyNotified(
  ownerId: string,
  type: NotificationType,
  entityId: string,
  withinDays: number,
): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      ownerId,
      type,
      entityId,
      createdAt: { gte: subDays(new Date(), withinDays) },
    },
    select: { id: true },
  });
  return existing !== null;
}

/** Due date for the given month, clamped to day 28 for short months. */
function dueDateFor(monthAnchor: Date, dueDay: number): Date {
  return new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth(),
    Math.min(Math.max(dueDay, 1), 28),
  );
}

export type SchedulerResult = {
  upcoming: number;
  late: number;
  expiring: number;
  /** Contracts closed automatically because their end date passed. */
  expired: number;
};

/**
 * Close contracts whose end date has passed without being renewed.
 *
 * Renewing already marks the previous contract EXPIRED; this covers the other
 * path — a lease that simply runs out — so the contract list doesn't fill up
 * with "active" leases that ended months ago.
 *
 * Open-ended contracts (`endDate: null`) are month-to-month by definition and
 * are never closed here. The property's status is deliberately left alone: a
 * lapsed contract doesn't prove the tenant moved out, and guessing would show
 * an occupied unit as available.
 */
async function expireLapsedContracts(now: Date): Promise<number> {
  const { count } = await prisma.contract.updateMany({
    where: {
      deletedAt: null,
      status: ContractStatus.ACTIVE,
      endDate: { not: null, lt: now },
    },
    data: { status: ContractStatus.EXPIRED },
  });
  return count;
}

/**
 * System-level job that fans reminder notifications out to every owner:
 *   • PAYMENT_UPCOMING  — rent due within 3 days, current period unpaid
 *   • PAYMENT_LATE      — due day passed this month, current period unpaid
 *   • CONTRACT_EXPIRING — active contract ends within 30 days
 *
 * Idempotent by design: each reminder de-dupes against recent notifications,
 * so the job can run daily (or be retried) without spamming.
 */
export async function runNotificationScheduler(): Promise<SchedulerResult> {
  const now = new Date();
  const result: SchedulerResult = {
    upcoming: 0,
    late: 0,
    expiring: 0,
    // Runs first so a lapsed contract isn't also reminded about below.
    expired: await expireLapsedContracts(now),
  };

  const reminderPrefs = await loadReminderPrefs();

  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null, status: ContractStatus.ACTIVE },
    select: {
      id: true,
      ownerId: true,
      dueDay: true,
      endDate: true,
      monthlyRent: true,
      currency: true,
      property: { select: { name: true } },
      tenant: { select: { firstName: true, lastName: true } },
    },
  });

  for (const contract of contracts) {
    const prefs = reminderPrefs.get(contract.ownerId) ?? DEFAULT_REMINDER_PREFS;
    const tenantName = `${contract.tenant.firstName} ${contract.tenant.lastName}`;
    const rent = formatCurrency(
      contract.monthlyRent.toString(),
      contract.currency,
    );
    const actionUrl = `/app/contracts/${contract.id}`;

    // --- Contract expiring ---------------------------------------------------
    if (prefs.notifyContractExpiring && contract.endDate) {
      const daysLeft = differenceInCalendarDays(contract.endDate, now);
      if (
        daysLeft >= 0 &&
        daysLeft <= prefs.contractExpiringLeadDays &&
        !(await alreadyNotified(
          contract.ownerId,
          NotificationType.CONTRACT_EXPIRING,
          contract.id,
          prefs.contractExpiringLeadDays,
        ))
      ) {
        await prisma.notification.create({
          data: {
            ownerId: contract.ownerId,
            type: NotificationType.CONTRACT_EXPIRING,
            title: 'Contract expiring soon',
            body: `The lease for ${contract.property.name} with ${tenantName} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            metadata: {
              key: 'contractExpiring',
              params: {
                property: contract.property.name,
                tenant: tenantName,
                days: daysLeft,
              },
            },
            entityType: 'Contract',
            entityId: contract.id,
            actionUrl,
            dueAt: contract.endDate,
          },
        });
        result.expiring += 1;
      }
    }

    // --- Rent payment status for the current period --------------------------
    const periodStart = startOfMonth(now);
    const paid = await prisma.payment.findFirst({
      where: {
        ownerId: contract.ownerId,
        contractId: contract.id,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        OR: [
          { periodStart },
          { paidAt: { gte: periodStart, lte: endOfMonth(now) } },
        ],
      },
      select: { id: true },
    });
    if (paid) continue;

    const dueThisMonth = dueDateFor(now, contract.dueDay);

    if (now > dueThisMonth) {
      // Late for the current period.
      if (
        prefs.notifyPaymentLate &&
        !(await alreadyNotified(
          contract.ownerId,
          NotificationType.PAYMENT_LATE,
          contract.id,
          7,
        ))
      ) {
        await prisma.notification.create({
          data: {
            ownerId: contract.ownerId,
            type: NotificationType.PAYMENT_LATE,
            title: 'Rent payment overdue',
            body: `${tenantName} hasn’t paid ${rent} for ${contract.property.name} (was due day ${contract.dueDay}).`,
            metadata: {
              key: 'paymentLate',
              params: {
                tenant: tenantName,
                amount: rent,
                property: contract.property.name,
                dueDay: contract.dueDay,
              },
            },
            entityType: 'Contract',
            entityId: contract.id,
            actionUrl,
            dueAt: dueThisMonth,
          },
        });
        result.late += 1;
      }
    } else {
      // Not yet due — remind when the window opens.
      const nextDue =
        dueThisMonth >= now
          ? dueThisMonth
          : dueDateFor(addMonths(now, 1), contract.dueDay);
      if (
        prefs.notifyPaymentUpcoming &&
        nextDue <= addDays(now, prefs.paymentUpcomingLeadDays) &&
        !(await alreadyNotified(
          contract.ownerId,
          NotificationType.PAYMENT_UPCOMING,
          contract.id,
          7,
        ))
      ) {
        await prisma.notification.create({
          data: {
            ownerId: contract.ownerId,
            type: NotificationType.PAYMENT_UPCOMING,
            title: 'Rent payment due soon',
            body: `${rent} from ${tenantName} for ${contract.property.name} is due in ${differenceInCalendarDays(nextDue, now)} day(s).`,
            metadata: {
              key: 'paymentUpcoming',
              params: {
                amount: rent,
                tenant: tenantName,
                property: contract.property.name,
                days: differenceInCalendarDays(nextDue, now),
              },
            },
            entityType: 'Contract',
            entityId: contract.id,
            actionUrl,
            dueAt: nextDue,
          },
        });
        result.upcoming += 1;
      }
    }
  }

  return result;
}
