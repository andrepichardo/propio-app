import { describe, expect, it } from 'vitest';
import {
  contractAnchorDay,
  nextPeriod,
  periodContaining,
  rentPeriodEnd,
  dueDateForPeriod,
  firstUncoveredMonth,
  isPeriodWithinTerm,
  monthKey,
  monthValueToDate,
  periodMonthBounds,
  periodToMonthValue,
  rentPeriodStart,
  shiftMonthValue,
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

describe('shiftMonthValue', () => {
  it('moves within a year', () => {
    expect(shiftMonthValue('2026-07', 2)).toBe('2026-09');
    expect(shiftMonthValue('2026-07', -2)).toBe('2026-05');
  });

  it('crosses year boundaries in both directions', () => {
    expect(shiftMonthValue('2026-12', 1)).toBe('2027-01');
    expect(shiftMonthValue('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthValue('2026-01', -13)).toBe('2024-12');
  });

  it('leaves a malformed value alone', () => {
    expect(shiftMonthValue('nope', 1)).toBe('nope');
  });
});

describe('isPeriodWithinTerm', () => {
  // The contract André asked about: 15 Jul 2026 – 15 Jul 2027, due day 15.
  const term = {
    startDate: new Date('2026-07-15T00:00:00.000Z'),
    endDate: new Date('2027-07-15T00:00:00.000Z'),
  };
  const period = (month: string) =>
    rentPeriodStart(monthValueToDate(month) as Date, 15);

  it('accepts the first month of the term', () => {
    expect(isPeriodWithinTerm(period('2026-07'), term)).toBe(true);
  });

  it('accepts the last payable month', () => {
    expect(isPeriodWithinTerm(period('2027-06'), term)).toBe(true);
  });

  it('rejects a month before the contract started', () => {
    // What used to be accepted: paying April on a contract starting in July.
    expect(isPeriodWithinTerm(period('2026-04'), term)).toBe(false);
    expect(isPeriodWithinTerm(period('2026-06'), term)).toBe(false);
  });

  it('rejects the period that starts exactly when the term ends', () => {
    expect(isPeriodWithinTerm(period('2027-07'), term)).toBe(false);
  });

  it('accepts a period that only overlaps the term partially', () => {
    // Contract starts on the 20th, due day 15: the tenant's first month is the
    // 15th–15th period that began five days before they moved in.
    const late = {
      startDate: new Date('2026-08-20T00:00:00.000Z'),
      endDate: new Date('2027-08-20T00:00:00.000Z'),
    };
    expect(isPeriodWithinTerm(period('2026-08'), late)).toBe(true);
  });

  it('has no upper bound on an open-ended contract', () => {
    const open = { startDate: new Date('2026-07-15T00:00:00.000Z') };
    expect(isPeriodWithinTerm(period('2030-01'), open)).toBe(true);
    expect(isPeriodWithinTerm(period('2026-05'), open)).toBe(false);
  });

  it('compares by day, ignoring a stored local-midnight offset', () => {
    // Real dev rows hold `T04:00:00Z` contract dates. Comparing instants let
    // the period starting 1 May squeeze inside a term ending 1 May.
    const offset = {
      startDate: new Date('2026-05-01T04:00:00.000Z'),
      endDate: new Date('2027-05-01T04:00:00.000Z'),
    };
    expect(isPeriodWithinTerm(period('2027-05'), offset)).toBe(false);
    expect(isPeriodWithinTerm(period('2027-04'), offset)).toBe(true);
  });

  it('does not drift on a month-end period', () => {
    // Jan 31 + 1 month clamps to Feb 28, and reading UTC parts keeps it there
    // no matter the reader's timezone.
    const feb = {
      startDate: new Date('2026-02-27T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    };
    expect(isPeriodWithinTerm(new Date('2026-01-31T00:00:00.000Z'), feb)).toBe(
      true,
    );
  });
});

describe('periodMonthBounds', () => {
  it('bounds a whole-year term to its twelve payable months', () => {
    expect(
      periodMonthBounds(
        {
          startDate: new Date('2026-07-15T00:00:00.000Z'),
          endDate: new Date('2027-07-15T00:00:00.000Z'),
        },
        15,
      ),
    ).toEqual({ min: '2026-07', max: '2027-06' });
  });

  it('opens the month before the start when the due day precedes it', () => {
    // Starts 20 Aug, due day 15 → the 15 Aug – 15 Sep period is payable.
    expect(
      periodMonthBounds(
        {
          startDate: new Date('2026-08-20T00:00:00.000Z'),
          endDate: new Date('2027-08-20T00:00:00.000Z'),
        },
        15,
      ),
    ).toEqual({ min: '2026-08', max: '2027-08' });
  });

  it('gives a twelve-month term exactly twelve payable months', () => {
    // Due day 1 on a 1 May 2026 – 1 May 2027 term, as stored in dev.
    const bounds = periodMonthBounds(
      {
        startDate: new Date('2026-05-01T04:00:00.000Z'),
        endDate: new Date('2027-05-01T04:00:00.000Z'),
      },
      1,
    );
    expect(bounds).toEqual({ min: '2026-05', max: '2027-04' });
  });

  it('leaves an open-ended contract without an upper bound', () => {
    expect(
      periodMonthBounds(
        { startDate: new Date('2026-07-15T00:00:00.000Z') },
        15,
      ),
    ).toEqual({ min: '2026-07' });
  });

  it('never returns an inverted range on a term shorter than a month', () => {
    const bounds = periodMonthBounds(
      {
        startDate: new Date('2026-07-20T00:00:00.000Z'),
        endDate: new Date('2026-07-28T00:00:00.000Z'),
      },
      15,
    );
    expect(bounds.max).not.toBeUndefined();
    expect(bounds.max! >= bounds.min).toBe(true);
  });

  it('agrees with isPeriodWithinTerm on every month around the bounds', () => {
    const term = {
      startDate: new Date('2026-07-15T00:00:00.000Z'),
      endDate: new Date('2027-07-15T00:00:00.000Z'),
    };
    const { min, max } = periodMonthBounds(term, 15);

    for (let step = -3; step <= 15; step += 1) {
      const month = shiftMonthValue(min, step);
      const inBounds = month >= min && (!max || month <= max);
      const allowed = isPeriodWithinTerm(
        rentPeriodStart(monthValueToDate(month) as Date, 15),
        term,
      );
      expect({ month, inBounds }).toEqual({ month, inBounds: allowed });
    }
  });
});

describe('contractAnchorDay', () => {
  it('reads the start day in UTC', () => {
    // A local getter west of UTC turns a 1 May start into 30 April.
    expect(contractAnchorDay(new Date('2026-05-01T00:00:00.000Z'))).toBe(1);
    expect(contractAnchorDay(new Date('2026-05-01T04:00:00.000Z'))).toBe(1);
    expect(contractAnchorDay(new Date('2026-07-15T00:00:00.000Z'))).toBe(15);
  });
});

describe('dueDateForPeriod', () => {
  it('lands in the same month when the due day comes after the anchor', () => {
    // Costa Azul: starts the 1st, rent due the 28th → 1 May – 1 Jun is due 28 May.
    const period = new Date('2026-05-01T00:00:00.000Z');
    expect(iso(dueDateForPeriod(period, 28))).toBe('2026-05-28');
  });

  it('rolls into the next month when the due day precedes the anchor', () => {
    // Starts the 25th, due the 5th → 25 Aug – 25 Sep has no 5th until September.
    const period = new Date('2026-08-25T00:00:00.000Z');
    expect(iso(dueDateForPeriod(period, 5))).toBe('2026-09-05');
  });

  it('is the period start itself when both days match', () => {
    const period = new Date('2026-07-15T00:00:00.000Z');
    expect(iso(dueDateForPeriod(period, 15))).toBe('2026-07-15');
  });

  it('clamps a due day the month does not have', () => {
    const period = new Date('2026-02-01T00:00:00.000Z');
    expect(iso(dueDateForPeriod(period, 31))).toBe('2026-02-28');
  });

  it('crosses the year boundary', () => {
    const period = new Date('2026-12-25T00:00:00.000Z');
    expect(iso(dueDateForPeriod(period, 5))).toBe('2027-01-05');
  });

  it('always falls inside the period it pays for', () => {
    // The invariant the dashboard and the scheduler depend on.
    for (const anchorDay of [1, 5, 15, 25, 28, 31]) {
      for (const dueDay of [1, 5, 15, 25, 28, 31]) {
        for (const month of [0, 1, 5, 11]) {
          const period = rentPeriodStart(
            new Date(Date.UTC(2026, month, 15)),
            anchorDay,
          );
          const due = dueDateForPeriod(period, dueDay);
          const next = rentPeriodStart(
            new Date(Date.UTC(2026, month + 1, 15)),
            anchorDay,
          );
          expect({
            anchorDay,
            dueDay,
            month,
            inside: due >= period && due < next,
          }).toEqual({ anchorDay, dueDay, month, inside: true });
        }
      }
    }
  });
});

describe('the contract André reported (1 May 2026 – 1 May 2027, due day 28)', () => {
  const term = {
    startDate: new Date('2026-05-01T04:00:00.000Z'),
    endDate: new Date('2027-05-01T04:00:00.000Z'),
  };
  const anchorDay = contractAnchorDay(term.startDate);

  it('is anchored to the 1st, not to the due day', () => {
    const period = rentPeriodStart(
      new Date('2026-09-04T00:00:00.000Z'),
      anchorDay,
    );
    expect(iso(period)).toBe('2026-09-01');
  });

  it('offers exactly the twelve months of the lease', () => {
    expect(periodMonthBounds(term, anchorDay)).toEqual({
      min: '2026-05',
      max: '2027-04',
    });
  });

  it('no longer accepts April 2026', () => {
    const april = rentPeriodStart(
      monthValueToDate('2026-04') as Date,
      anchorDay,
    );
    expect(isPeriodWithinTerm(april, term)).toBe(false);
  });

  it('still bills rent on the 28th', () => {
    const may = rentPeriodStart(monthValueToDate('2026-05') as Date, anchorDay);
    expect(iso(dueDateForPeriod(may, 28))).toBe('2026-05-28');
  });
});

describe('rentPeriodEnd', () => {
  it('lands on the same day next month, in UTC', () => {
    // date-fns addMonths reads these in local time: west of UTC it turns
    // 1 May into 31 May, and 1 Mar into 29 Mar.
    expect(iso(rentPeriodEnd(new Date('2026-05-01T00:00:00.000Z')))).toBe(
      '2026-06-01',
    );
    expect(iso(rentPeriodEnd(new Date('2026-03-01T00:00:00.000Z')))).toBe(
      '2026-04-01',
    );
    expect(iso(rentPeriodEnd(new Date('2026-07-15T00:00:00.000Z')))).toBe(
      '2026-08-15',
    );
  });

  it('clamps into a shorter month', () => {
    expect(iso(rentPeriodEnd(new Date('2026-01-31T00:00:00.000Z')))).toBe(
      '2026-02-28',
    );
  });
});

describe('periodContaining', () => {
  it('returns the period already running, not the one still ahead', () => {
    // 4 Sep on a 15th-anchored lease: the tenant is in 15 Aug – 15 Sep.
    const date = new Date('2026-09-04T00:00:00.000Z');
    expect(iso(periodContaining(date, 15))).toBe('2026-08-15');
  });

  it('returns this month once the anchor day has arrived', () => {
    const date = new Date('2026-09-20T00:00:00.000Z');
    expect(iso(periodContaining(date, 15))).toBe('2026-09-15');
  });

  it('is the day itself on the anchor', () => {
    const date = new Date('2026-09-15T00:00:00.000Z');
    expect(iso(periodContaining(date, 15))).toBe('2026-09-15');
  });

  it('crosses the year boundary backwards', () => {
    const date = new Date('2026-01-04T00:00:00.000Z');
    expect(iso(periodContaining(date, 15))).toBe('2025-12-15');
  });

  it('never skips a period, for any anchor day', () => {
    // `period <= date < nextPeriod(period)` — the containment invariant that
    // survives the 29–31 anchors, where the calendar itself leaves a gap
    // (28 Feb–28 Mar ends before a period re-anchored to 31 Mar begins).
    for (const anchorDay of [1, 5, 15, 28, 29, 30, 31]) {
      for (let day = 1; day <= 28; day += 3) {
        for (const month of [0, 1, 2, 11]) {
          const date = new Date(Date.UTC(2026, month, day));
          const period = periodContaining(date, anchorDay);
          expect({
            anchorDay,
            month,
            day,
            ok: period <= date && date < nextPeriod(period, anchorDay),
          }).toEqual({ anchorDay, month, day, ok: true });
        }
      }
    }
  });

  it('reports the last period that started when the anchor leaves a gap', () => {
    // Anchor 31: February clamps to the 28th, so 28–30 March sit between the
    // period that just ended and the one that re-anchors on the 31st.
    const date = new Date('2026-03-29T00:00:00.000Z');
    expect(iso(periodContaining(date, 31))).toBe('2026-02-28');
  });
});

describe('nextPeriod', () => {
  it('advances a month', () => {
    expect(iso(nextPeriod(new Date('2026-05-01T00:00:00.000Z'), 1))).toBe(
      '2026-06-01',
    );
  });

  it('recovers an anchor the calendar had to clamp', () => {
    // 31 Jan clamps to 28 Feb, and March must go back to the 31st.
    const feb = nextPeriod(new Date('2026-01-31T00:00:00.000Z'), 31);
    expect(iso(feb)).toBe('2026-02-28');
    expect(iso(nextPeriod(feb, 31))).toBe('2026-03-31');
  });
});
