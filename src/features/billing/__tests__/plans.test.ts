import { describe, expect, it } from 'vitest';
import { Plan } from '@/generated/prisma/enums';
import {
  canAddProperty,
  effectivePlan,
  formatUsd,
  higherPlan,
  monthlyEquivalent,
  PLANS,
} from '@/features/billing/plans';

describe('PLANS', () => {
  it('matches the advertised catalogue', () => {
    expect(PLANS.FREE.propertyLimit).toBe(1);
    expect(PLANS.PRO).toEqual({
      propertyLimit: 20,
      price: { MONTH: 10, YEAR: 100 },
    });
    expect(PLANS.BUSINESS).toEqual({
      propertyLimit: 100,
      price: { MONTH: 50, YEAR: 500 },
    });
  });

  it('prices a year at ten months', () => {
    expect(PLANS.PRO.price.YEAR).toBe(PLANS.PRO.price.MONTH * 10);
    expect(PLANS.BUSINESS.price.YEAR).toBe(PLANS.BUSINESS.price.MONTH * 10);
    expect(monthlyEquivalent(Plan.PRO)).toBe(8.33);
    expect(monthlyEquivalent(Plan.BUSINESS)).toBe(41.67);
  });
});

describe('higherPlan', () => {
  it('orders FREE < PRO < BUSINESS', () => {
    expect(higherPlan(Plan.FREE, Plan.PRO)).toBe(Plan.PRO);
    expect(higherPlan(Plan.BUSINESS, Plan.PRO)).toBe(Plan.BUSINESS);
    expect(higherPlan(Plan.PRO, Plan.PRO)).toBe(Plan.PRO);
  });
});

describe('effectivePlan', () => {
  it('is FREE with nothing', () => {
    expect(effectivePlan({ compPlan: null, subscriptions: [] })).toBe(
      Plan.FREE,
    );
  });

  it('keeps the plan while a charge is being retried', () => {
    expect(
      effectivePlan({
        compPlan: null,
        subscriptions: [{ plan: Plan.PRO, status: 'past_due' }],
      }),
    ).toBe(Plan.PRO);
  });

  it('drops a canceled or paused subscription', () => {
    for (const status of ['canceled', 'paused']) {
      expect(
        effectivePlan({
          compPlan: null,
          subscriptions: [{ plan: Plan.BUSINESS, status }],
        }),
      ).toBe(Plan.FREE);
    }
  });

  it('never goes below the comp plan', () => {
    expect(
      effectivePlan({
        compPlan: Plan.PRO,
        subscriptions: [{ plan: Plan.BUSINESS, status: 'canceled' }],
      }),
    ).toBe(Plan.PRO);
  });

  it('takes the best of several live subscriptions', () => {
    expect(
      effectivePlan({
        compPlan: null,
        subscriptions: [
          { plan: Plan.PRO, status: 'active' },
          { plan: Plan.BUSINESS, status: 'active' },
        ],
      }),
    ).toBe(Plan.BUSINESS);
  });
});

describe('canAddProperty', () => {
  it('allows up to the limit and not one more', () => {
    expect(canAddProperty(Plan.FREE, 0)).toBe(true);
    expect(canAddProperty(Plan.FREE, 1)).toBe(false);
    expect(canAddProperty(Plan.PRO, 19)).toBe(true);
    expect(canAddProperty(Plan.PRO, 20)).toBe(false);
    expect(canAddProperty(Plan.BUSINESS, 99)).toBe(true);
    expect(canAddProperty(Plan.BUSINESS, 100)).toBe(false);
  });

  it('only blocks, never breaks, an owner already over the limit', () => {
    expect(canAddProperty(Plan.FREE, 7)).toBe(false);
  });
});

describe('formatUsd', () => {
  it('drops cents on whole amounts and keeps a dot otherwise', () => {
    expect(formatUsd(10)).toBe('US$10');
    expect(formatUsd(8.33)).toBe('US$8.33');
    expect(formatUsd(41.7)).toBe('US$41.70');
  });
});
