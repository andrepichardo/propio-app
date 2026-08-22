/**
 * Rent-period date maths, shared by the payment service (which decides which
 * period a payment settles) and the dashboard (which buckets those payments
 * into months). The two MUST agree — if they disagree, a payment counts toward
 * one month while the contract still shows unpaid in another.
 *
 * Kept free of server-only imports so it is unit-testable on its own; both
 * functions are pure.
 */
import { addMonths } from 'date-fns';

/**
 * Rent period a payment covers, anchored to the contract's **due day** — never
 * the date it happened to be paid. It runs from `dueDay` of the paidAt month to
 * the same day next month (e.g. due day 15, paid Aug 4 → 15 Aug – 15 Sep; the
 * same for a payment made Aug 20). Built at UTC midnight like other date-only
 * values, so `nextRentDueDate` and month bucketing stay consistent.
 *
 * `dueDay` is clamped into the month: day 31 in February lands on the 28th/29th
 * rather than overflowing into March.
 */
export function rentPeriodStart(paidAt: Date, dueDay: number): Date {
  const year = paidAt.getUTCFullYear();
  const month = paidAt.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(dueDay, 1), daysInMonth);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Month bucket a payment counts toward: its rent period, else when paid.
 * Date-only values (periodStart, form-picked paidAt) live at UTC midnight;
 * reading them with local getters west of UTC would land on the previous
 * month at month boundaries, so those use their UTC parts.
 */
export function monthKey(date: Date): string {
  const isUtcMidnight = date.getTime() % 86_400_000 === 0;
  const year = isUtcMidnight ? date.getUTCFullYear() : date.getFullYear();
  const month = isUtcMidnight ? date.getUTCMonth() : date.getMonth();
  return `${year}-${month}`;
}

/**
 * Next due date for a contract, relative to `reference`.
 *
 * `dueDay` is clamped to 28 so a contract due on the 29th–31st still lands on
 * a day that exists in EVERY month — the alternative (rolling into the next
 * month) would silently skip February.
 *
 * Unlike the date-only helpers above this works in LOCAL time on purpose: it
 * answers "what is the next due date from now", a question about the reader's
 * present, not a stored calendar value.
 */
export function nextDueDate(dueDay: number, reference = new Date()): Date {
  const day = Math.min(Math.max(dueDay, 1), 28);
  const thisMonth = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    day,
  );
  return thisMonth >= reference ? thisMonth : addMonths(thisMonth, 1);
}
