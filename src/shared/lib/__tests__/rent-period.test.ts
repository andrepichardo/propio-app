import { describe, expect, it } from 'vitest';
import { monthKey, rentPeriodStart } from '@/shared/lib/rent-period';

/** Readable assertion helper: a UTC-midnight date as `yyyy-MM-dd`. */
const iso = (date: Date) => date.toISOString().slice(0, 10);

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
