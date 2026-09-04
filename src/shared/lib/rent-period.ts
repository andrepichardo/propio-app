/**
 * Rent-period date maths, shared by every feature that has to agree on what a
 * rent period IS: the payment service (which period a payment settles), the
 * dashboard (which month a payment counts toward, and what is still owed) and
 * the reminder scheduler. If they disagree, a payment counts toward one month
 * while the contract still shows unpaid in another.
 *
 * **A period runs from the contract's start day to the same day next month.**
 * A lease running 1 May 2026 – 1 May 2027 has twelve periods, 1st to 1st.
 * `dueDay` is NOT what defines them — it is only the day of the month the
 * payment is DUE (exactly what the UI calls it: "Día de pago · Día del mes en
 * que vence el alquiler"), and `dueDateForPeriod` places it inside the period
 * it pays for.
 *
 * Anchoring periods to `dueDay` instead was the original design and it was
 * wrong: a lease starting 1 May with due day 28 reported its periods as
 * "28 Apr – 28 May", which offered April on a contract that began in May and
 * never lined up with the contract's own dates.
 *
 * Kept free of server-only imports so it is unit-testable on its own; every
 * function here is pure. It also takes NO date-fns: `addMonths`, `startOfMonth`
 * and friends walk dates in LOCAL time, which is wrong for UTC-midnight values
 * and silently right on a UTC server — the worst combination to debug.
 */

/**
 * Rent period a payment covers, anchored to `anchorDay` — the day of the month
 * the CONTRACT started (`contractAnchorDay`), never the date it happened to be
 * paid. It runs from that day in `date`'s month to the same day next month
 * (start day 15, paid Aug 4 or Aug 20 → both 15 Aug – 15 Sep). Built at UTC
 * midnight like other date-only values, so month bucketing stays consistent.
 *
 * `anchorDay` is clamped into the month: day 31 in February lands on the
 * 28th/29th rather than overflowing into March.
 */
export function rentPeriodStart(date: Date, anchorDay: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(anchorDay, 1), daysInMonth);
  return new Date(Date.UTC(year, month, day));
}

/**
 * The period that CONTAINS `date` — the one being occupied right now.
 *
 * Not the same question as `rentPeriodStart`, which returns the period
 * anchored in `date`'s own month: on the 4th of September with a 15th anchor
 * that period has not started yet, and the tenant is still living in the one
 * that began 15 August. The dashboard and the reminder scheduler both need
 * THIS one — "what is currently owed" — while a payment's period is whichever
 * month the owner picked.
 *
 * On an anchor of 29–31 the calendar leaves a gap: a period clamped to 28 Feb
 * ends 28 Mar while the next one re-anchors to the 31st, so 28–30 March belong
 * to no period. There this returns the period that most recently STARTED, which
 * is what the callers want anyway — it is the last one that could be owed, and
 * `period <= date < nextPeriod(period)` still holds, so no period is skipped.
 */
export function periodContaining(date: Date, anchorDay: number): Date {
  const candidate = rentPeriodStart(date, anchorDay);
  if (utcDay(candidate) <= utcDay(date)) return candidate;
  // Mid-month reference so the previous month's own length can't shift it.
  const previous = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 15),
  );
  return rentPeriodStart(previous, anchorDay);
}

/**
 * The period after this one. Re-anchored rather than simply taking the end
 * date, so an anchor the calendar had to clamp comes back: 31 Jan → 28 Feb →
 * 31 Mar, not 28 Feb → 28 Mar for the rest of the lease.
 */
export function nextPeriod(period: Date, anchorDay: number): Date {
  return rentPeriodStart(rentPeriodEnd(period), anchorDay);
}

/**
 * The day of the month a contract's periods are anchored to — its start day.
 *
 * Read in UTC because contract dates are date-only values; a local getter west
 * of UTC turns a 1 May start into the 30th of April.
 */
export function contractAnchorDay(startDate: Date): number {
  return startDate.getUTCDate();
}

/**
 * When the rent for `period` is due: the contract's `dueDay`, placed INSIDE
 * that period.
 *
 * Which month that lands in follows from the period's own anchor. A lease
 * starting on the 1st with due day 28 is due on the 28th of the month it
 * starts (1 May – 1 Jun ⇒ due 28 May). A lease starting on the 25th with due
 * day 5 has no 5th until the following month (25 Aug – 25 Sep ⇒ due 5 Sep).
 * Either way the date sits within the period it pays for, which is what lets
 * the dashboard and the reminder scheduler agree on which period is late —
 * `period <= due < next period` is guaranteed, and unit-tested across every
 * anchor/due-day pair. The last line is what guarantees it in the degenerate
 * case: a period anchored to the 31st that ends 28 Feb contains no 28th at
 * all, so the due date falls back to the last day the period does contain.
 */
export function dueDateForPeriod(period: Date, dueDay: number): Date {
  const anchorDay = period.getUTCDate();
  const wanted = Math.min(Math.max(dueDay, 1), 31);
  const monthOffset = wanted >= anchorDay ? 0 : 1;
  const year = period.getUTCFullYear();
  const month = period.getUTCMonth() + monthOffset;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const due = new Date(Date.UTC(year, month, Math.min(wanted, daysInMonth)));

  const end = rentPeriodEnd(period);
  if (due.getTime() < end.getTime()) return due;
  return new Date(end.getTime() - 86_400_000);
}

/**
 * `yyyy-MM` for a rent period — the value shape `MonthPicker` speaks. Periods
 * are date-only values at UTC midnight, so they are read with UTC parts.
 */
export function periodToMonthValue(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

/**
 * First day of the month a `yyyy-MM` value denotes, at UTC midnight. Feed the
 * result to `rentPeriodStart` to anchor it to a contract's start day — that
 * way a form only has to send a month and never needs to know the anchor.
 */
export function monthValueToDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return undefined;
  return new Date(Date.UTC(Number(match[1]), month, 1));
}

/** Shift a `yyyy-MM` value by whole months. Pure string/number arithmetic. */
export function shiftMonthValue(value: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const total = Number(match[1]) * 12 + (Number(match[2]) - 1) + delta;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Whether a rent period belongs to a contract's term at all.
 *
 * Decided by OVERLAP: a period counts when it overlaps the term by any amount
 * — it starts before the contract ends AND ends after the contract starts. An
 * open-ended contract (`endDate` null) has no upper bound.
 *
 * With periods anchored to the start day the edges are exact, not partial: the
 * period of the starting month begins ON `startDate`, and the one before it
 * ends there, so it falls out. Overlap still matters at the far end, where a
 * term can stop mid-period (ends 15 Jun on a 1st-to-1st lease) — that period
 * covers fifteen real days and has to remain payable.
 *
 * Compared by DAY, not by instant: contract dates are meant to be UTC midnight
 * but rows exist that were stored at `T04:00:00Z` (a local midnight that was
 * never normalised). Comparing raw timestamps let a term ending 1 May count
 * the period starting that same morning, handing every such contract a
 * thirteenth payable month.
 */
export function isPeriodWithinTerm(
  period: Date,
  term: { startDate: Date; endDate?: Date | null },
): boolean {
  const start = utcDay(period);
  if (term.endDate && start >= utcDay(term.endDate)) return false;
  return utcDay(rentPeriodEnd(period)) > utcDay(term.startDate);
}

/** The UTC calendar day a date falls on, as a comparable timestamp. */
function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Half-open `[gte, lt)` range covering the UTC month a period starts in — the
 * shape a Prisma date filter wants when matching payments by month.
 *
 * Every consumer buckets periods by month rather than by an exact
 * `periodStart`, so rows anchored to something else (written before periods
 * followed the contract's start day, or after a start date was corrected)
 * still land in the right month. Built from UTC parts because date-fns
 * `startOfMonth` works in local time: west of UTC it reads 1 May 00:00Z as
 * 30 April and returns the wrong month entirely.
 */
export function monthRangeOf(period: Date): { gte: Date; lt: Date } {
  const year = period.getUTCFullYear();
  const month = period.getUTCMonth();
  return {
    gte: new Date(Date.UTC(year, month, 1)),
    lt: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/**
 * Where a period stops: the same day next month, clamped into it the way
 * `rentPeriodStart` clamps the anchor day (a period starting Jan 31 ends
 * Feb 28).
 *
 * Done in UTC parts rather than with date-fns `addMonths`, which preserves the
 * LOCAL day and is WRONG on these values: west of UTC it reads 1 May 00:00Z as
 * 30 Apr, adds a month to get 30 May, and hands back 31 May — a day short, and
 * three days short across February. Anything that needs a period's end (a form
 * showing the range, the receipt's default concept) must call this, never
 * `addMonths`.
 */
export function rentPeriodEnd(period: Date): Date {
  const year = period.getUTCFullYear();
  const month = period.getUTCMonth();
  const daysInNext = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  return new Date(
    Date.UTC(year, month + 1, Math.min(period.getUTCDate(), daysInNext)),
  );
}

/**
 * The `yyyy-MM` months a contract can be paid for, as inclusive bounds for
 * `MonthPicker` — `max` is absent on an open-ended contract.
 *
 * With periods anchored to the contract's own start day these line up exactly:
 * a 1 May 2026 – 1 May 2027 lease yields 2026-05 … 2027-04, twelve periods, no
 * stray month at either edge. `anchorDay` comes from `contractAnchorDay`;
 * passing anything else (the due day, say) re-creates the very bug this
 * replaced.
 *
 * Each candidate is verified against `isPeriodWithinTerm` rather than derived
 * with its own arithmetic: only the month holding each bound and its neighbour
 * can be the edge, so checking those two settles it, and there is exactly one
 * rule to keep right.
 */
export function periodMonthBounds(
  term: { startDate: Date; endDate?: Date | null },
  anchorDay: number,
): { min: string; max?: string } {
  const within = (month: string) => {
    const date = monthValueToDate(month);
    return date
      ? isPeriodWithinTerm(rentPeriodStart(date, anchorDay), term)
      : false;
  };

  const startMonth = periodToMonthValue(term.startDate);
  const beforeStart = shiftMonthValue(startMonth, -1);
  const min = within(beforeStart) ? beforeStart : startMonth;

  if (!term.endDate) return { min };

  const endMonth = periodToMonthValue(term.endDate);
  const max = within(endMonth) ? endMonth : shiftMonthValue(endMonth, -1);
  // A term shorter than the gap between due days can leave no payable month
  // at all; report the start rather than an inverted range.
  return { min, max: max < min ? min : max };
}

/**
 * First period from `fromMonth` forward that is not already covered, as a
 * `yyyy-MM` value — what the payment form preselects so paying a month twice
 * takes a deliberate change rather than being the default.
 *
 * Pure string arithmetic on purpose: both inputs are already month values, so
 * there is no local-vs-UTC question to get wrong. Gives up after two years
 * rather than looping on a pathological `covered` set.
 */
export function firstUncoveredMonth(
  covered: readonly string[],
  fromMonth: string,
): string {
  const match = /^(\d{4})-(\d{2})$/.exec(fromMonth);
  if (!match) return fromMonth;

  const taken = new Set(covered);
  let year = Number(match[1]);
  let month = Number(match[2]) - 1;

  for (let step = 0; step < 24; step += 1) {
    const value = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!taken.has(value)) return value;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return fromMonth;
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
