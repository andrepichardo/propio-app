import { describe, expect, it } from 'vitest';
import {
  isPeriodCovered,
  rentBalanceAfter,
  settlesRentPeriod,
} from '@/shared/lib/rent-settlement';

const RENT = 1200;

describe('settlesRentPeriod', () => {
  it('honours the flag on a rent payment', () => {
    expect(settlesRentPeriod(false, true)).toBe(true);
    expect(settlesRentPeriod(false, false)).toBe(false);
  });

  it('ignores the flag on a deposit', () => {
    // A deposit is the tenant's money held as a liability; it can never close
    // a rent period, whatever the form sent.
    expect(settlesRentPeriod(true, true)).toBe(false);
  });
});

describe('rentBalanceAfter', () => {
  it('leaves the shortfall on a partial payment', () => {
    expect(
      rentBalanceAfter({
        amount: 500,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBe(700);
  });

  it('leaves nothing when the rent is paid in full', () => {
    expect(
      rentBalanceAfter({
        amount: RENT,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBe(0);
  });

  it('never returns a negative balance on an overpayment', () => {
    expect(
      rentBalanceAfter({
        amount: 1500,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBe(0);
  });

  it('clears the balance for an agreed amount below the rent', () => {
    // The whole point of settlesPeriod: a discount that still closes the month.
    expect(
      rentBalanceAfter({
        amount: 900,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: true,
      }),
    ).toBe(0);
  });

  it('leaves no rent balance for a deposit, even a small one', () => {
    expect(
      rentBalanceAfter({
        amount: 50,
        monthlyRent: RENT,
        isDeposit: true,
        settlesPeriod: false,
      }),
    ).toBe(0);
  });

  it('handles decimal amounts without drifting', () => {
    expect(
      rentBalanceAfter({
        amount: 1199.99,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBeCloseTo(0.01, 10);
  });

  it('counts what the period was already paid', () => {
    // Second half of a 500 + 700 split: the month is closed, so the receipt
    // must not repeat the first payment's outstanding balance.
    expect(
      rentBalanceAfter({
        amount: 700,
        alreadyPaid: 500,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBe(0);
  });

  it('leaves only the real remainder after an earlier partial', () => {
    expect(
      rentBalanceAfter({
        amount: 300,
        alreadyPaid: 500,
        monthlyRent: RENT,
        isDeposit: false,
        settlesPeriod: false,
      }),
    ).toBe(400);
  });

  it('ignores earlier payments on a deposit', () => {
    expect(
      rentBalanceAfter({
        amount: 50,
        alreadyPaid: 500,
        monthlyRent: RENT,
        isDeposit: true,
        settlesPeriod: false,
      }),
    ).toBe(0);
  });
});

describe('isPeriodCovered', () => {
  it('is not covered when less than the rent was paid', () => {
    expect(
      isPeriodCovered({ paid: 500, monthlyRent: RENT, settled: false }),
    ).toBe(false);
  });

  it('is covered when exactly the rent was paid', () => {
    expect(
      isPeriodCovered({ paid: RENT, monthlyRent: RENT, settled: false }),
    ).toBe(true);
  });

  it('is covered on an overpayment', () => {
    expect(
      isPeriodCovered({ paid: 2000, monthlyRent: RENT, settled: false }),
    ).toBe(true);
  });

  it('is covered by the settled flag even when short', () => {
    // This is the pair of rentBalanceAfter's discount case: the receipt says
    // nothing is owed, so the dashboard must stop asking for the month.
    expect(
      isPeriodCovered({ paid: 900, monthlyRent: RENT, settled: true }),
    ).toBe(true);
  });

  it('is not covered when nothing was paid at all', () => {
    expect(
      isPeriodCovered({ paid: 0, monthlyRent: RENT, settled: false }),
    ).toBe(false);
  });
});

describe('the two halves of the invariant agree', () => {
  const cases: {
    name: string;
    amount: number;
    alreadyPaid: number;
    isDeposit: boolean;
    requested: boolean;
  }[] = [
    {
      name: 'full rent',
      amount: RENT,
      alreadyPaid: 0,
      isDeposit: false,
      requested: false,
    },
    {
      name: 'overpayment',
      amount: 1500,
      alreadyPaid: 0,
      isDeposit: false,
      requested: false,
    },
    {
      name: 'partial',
      amount: 500,
      alreadyPaid: 0,
      isDeposit: false,
      requested: false,
    },
    {
      name: 'agreed discount',
      amount: 900,
      alreadyPaid: 0,
      isDeposit: false,
      requested: true,
    },
    // The pair that used to disagree: the dashboard summed both halves and
    // called the month covered while the second receipt still claimed 700 due.
    {
      name: 'second half of a split',
      amount: 700,
      alreadyPaid: 500,
      isDeposit: false,
      requested: false,
    },
    {
      name: 'second partial that still falls short',
      amount: 300,
      alreadyPaid: 500,
      isDeposit: false,
      requested: false,
    },
  ];

  it.each(cases)(
    'a $name leaving no balance also stops appearing as upcoming',
    ({ amount, alreadyPaid, isDeposit, requested }) => {
      const settlesPeriod = settlesRentPeriod(isDeposit, requested);
      const balance = rentBalanceAfter({
        amount,
        alreadyPaid,
        monthlyRent: RENT,
        isDeposit,
        settlesPeriod,
      });
      const covered = isPeriodCovered({
        paid: alreadyPaid + amount,
        monthlyRent: RENT,
        settled: settlesPeriod,
      });

      // The rule that must never break: zero balance ⇔ month covered.
      expect(covered).toBe(balance === 0);
    },
  );
});
