import { describe, expect, it } from 'vitest';
import {
  firstUncoveredMonth,
  monthKey,
  monthValueToDate,
  nextDueDate,
  periodToMonthValue,
  rentPeriodStart,
} from '@/shared/lib/rent-period';

/** Readable assertion helper: a UTC-midnight date as `yyyy-MM-dd`. */
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe('periodToMonthValue', () => {
  it('reads a UTC-midnight period with UTC parts', () => {
    // Local getters west of UTC would report August for this September date.
    expect(periodToMonthValue(new Date('2026-09-01T00:00:00.000Z'))).toBe(
      '2026-09',
    );
  });

  it('pads the month', () => {
    expect(periodToMonthValue(new Date('2026-03-15T00:00:00.000Z'))).toBe(
      '2026-03',
    );
  });
});

describe('monthValueToDate', () => {
  it('round-trips with periodToMonthValue', () => {
    const date = monthValueToDate('2026-10');
    expect(date && iso(date)).toBe('2026-10-01');
    expect(date && periodToMonthValue(date)).toBe('2026-10');
  });

  it('anchors to the due day once passed through rentPeriodStart', () => {
    // This is the contract with the form: it sends a month, the service turns
    // it into the period, so the client never needs to know the due day.
    const month = monthValueToDate('2026-10');
    expect(month && iso(rentPeriodStart(month, 15))).toBe('2026-10-15');
  });

  it('rejects anything that is not yyyy-MM', () => {
    expect(monthValueToDate('2026-13')).toBeUndefined();
    expect(monthValueToDate('2026-00')).toBeUndefined();
    expect(monthValueToDate('2026-9')).toBeUndefined();
    expect(monthValueToDate('')).toBeUndefined();
  });
});

describe('firstUncoveredMonth', () => {
  it('keeps the reference month when nothing is covered', () => {
    expect(firstUncoveredMonth([], '2026-09')).toBe('2026-09');
  });

  it('skips covered months so a prepayment lands on the next one', () => {
    // The regression this guards: two full payments in the same calendar month
    // both defaulted to that month, so the second was absorbed as an
    // overpayment and "upcoming payments" never advanced.
    expect(firstUncoveredMonth(['2026-09'], '2026-09')).toBe('2026-10');
    expect(firstUncoveredMonth(['2026-09', '2026-10'], '2026-09')).toBe(
      '2026-11',
    );
  });

  it('rolls into the next year', () => {
    expect(firstUncoveredMonth(['2026-12'], '2026-12')).toBe('2027-01');
  });

  it('ignores covered months before the reference', () => {
    expect(firstUncoveredMonth(['2026-07', '2026-08'], '2026-09')).toBe(
      '2026-09',
    );
  });

  it('gives up after two years instead of looping', () => {
    const everything = Array.from({ length: 40 }, (_, i) => {
      const month = 8 + i;
      return `${2026 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, '0')}`;
    });
    expect(firstUncoveredMonth(everything, '2026-09')).toBe('2026-09');
  });

  it('returns a malformed reference untouched', () => {
    expect(firstUncoveredMonth([], 'nope')).toBe('nope');
  });
});

describe('rentPeriodStart', () => {
  it('anchors the period to the due day, not the day it was paid', () => {
    // The whole point: paying early or late inside the month must land on the
    // same period, or the dashboard and the receipt disagree.
    const early = rentPeriodStart(new Date('2026-08-04T00:00:00.000Z'), 15);
    const late = rentPeriodStart(new Date('2026-08-20T00:00:00.000Z'), 15);

    expect(iso(early)).toBe('2026-08-15');
    expect(iso(late)).toBe('2026-08-15');
  });

  it('returns UTC midnight, so date-only reads never shift a day', () => {
    const start = rentPeriodStart(new Date('2026-08-04T00:00:00.000Z'), 15);

    expect(start.getTime() % 86_400_000).toBe(0);
    expect(start.getUTCHours()).toBe(0);
  });

  it('keeps the period inside the paid month for a late-evening UTC payment', () => {
    // 23:30 UTC on Aug 31 is still August; local getters west of UTC would
    // read this as August too, but the month must come from the UTC parts.
    const start = rentPeriodStart(new Date('2026-08-31T23:30:00.000Z'), 1);

    expect(iso(start)).toBe('2026-08-01');
  });

  it('clamps a due day that overflows the month instead of spilling over', () => {
    const feb = rentPeriodStart(new Date('2026-02-10T00:00:00.000Z'), 31);
    // 2028 is a leap year — the 29th exists.
    const leapFeb = rentPeriodStart(new Date('2028-02-10T00:00:00.000Z'), 31);

    expect(iso(feb)).toBe('2026-02-28');
    expect(iso(leapFeb)).toBe('2028-02-29');
  });

  it('clamps a nonsensical due day into the month', () => {
    expect(iso(rentPeriodStart(new Date('2026-08-10T00:00:00.000Z'), 0))).toBe(
      '2026-08-01',
    );
    expect(iso(rentPeriodStart(new Date('2026-08-10T00:00:00.000Z'), 99))).toBe(
      '2026-08-31',
    );
  });
});

describe('monthKey', () => {
  it('buckets a UTC-midnight date by its UTC month', () => {
    // The regression this guards: read with local getters west of UTC, this
    // lands on 31 July and the payment counts toward the wrong month.
    expect(monthKey(new Date('2026-08-01T00:00:00.000Z'))).toBe('2026-7');
  });

  it('buckets the last UTC-midnight day of a month correctly', () => {
    expect(monthKey(new Date('2026-08-31T00:00:00.000Z'))).toBe('2026-7');
  });

  it('agrees with rentPeriodStart for a payment made at a month boundary', () => {
    // These two functions have to stay in lockstep: the period a payment
    // settles must fall in the month the dashboard counts it toward.
    const paidAt = new Date('2026-09-01T00:00:00.000Z');
    const period = rentPeriodStart(paidAt, 1);

    expect(monthKey(period)).toBe('2026-8');
  });

  it('uses local parts for a real timestamp, which is not UTC midnight', () => {
    // Timestamps (created by `new Date()`, not a date picker) are instants, so
    // the local reading is the right one — that is the branch's purpose.
    const stamp = new Date(2026, 7, 15, 14, 30);

    expect(monthKey(stamp)).toBe('2026-7');
  });
});

describe('nextDueDate', () => {
  it('uses this month when the due day is still ahead', () => {
    const reference = new Date(2026, 7, 3); // 3 Aug
    expect(nextDueDate(15, reference)).toEqual(new Date(2026, 7, 15));
  });

  it('rolls to next month once the due day has passed', () => {
    const reference = new Date(2026, 7, 20); // 20 Aug
    expect(nextDueDate(15, reference)).toEqual(new Date(2026, 8, 15));
  });

  it('treats the due day itself as still due today', () => {
    const reference = new Date(2026, 7, 15); // exactly the due day, midnight
    expect(nextDueDate(15, reference)).toEqual(new Date(2026, 7, 15));
  });

  it('clamps a due day of 29-31 to 28 so February is never skipped', () => {
    const reference = new Date(2026, 0, 5); // 5 Jan
    expect(nextDueDate(31, reference)).toEqual(new Date(2026, 0, 28));
    expect(nextDueDate(29, new Date(2026, 1, 1))).toEqual(
      new Date(2026, 1, 28),
    );
  });

  it('clamps a nonsensical due day up to 1', () => {
    const reference = new Date(2026, 7, 20);
    expect(nextDueDate(0, reference)).toEqual(new Date(2026, 8, 1));
  });

  it('crosses the year boundary', () => {
    const reference = new Date(2026, 11, 20); // 20 Dec
    expect(nextDueDate(5, reference)).toEqual(new Date(2027, 0, 5));
  });
});
