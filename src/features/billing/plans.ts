import { BillingInterval, Plan } from '@/generated/prisma/enums';

/**
 * The plan catalogue. Pure and client-safe: the landing's pricing section,
 * the billing page and the server-side limit check all read this one table,
 * so a price or a limit can never disagree between what is advertised and
 * what is enforced. Prices are whole US dollars and must match Paddle's.
 */
export const PLANS = {
  [Plan.FREE]: { propertyLimit: 1, price: { MONTH: 0, YEAR: 0 } },
  [Plan.PRO]: { propertyLimit: 20, price: { MONTH: 10, YEAR: 100 } },
  [Plan.BUSINESS]: { propertyLimit: 100, price: { MONTH: 50, YEAR: 500 } },
} as const satisfies Record<
  Plan,
  { propertyLimit: number; price: Record<BillingInterval, number> }
>;

export const PLAN_ORDER = [Plan.FREE, Plan.PRO, Plan.BUSINESS] as const;
export const PAID_PLANS = [Plan.PRO, Plan.BUSINESS] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

/** Paddle price id per paid plan and interval. Not secret: Paddle.js needs them in the browser. */
export type PriceIds = Record<PaidPlan, Record<BillingInterval, string>>;

export const BILLING_INTERVALS = [
  BillingInterval.MONTH,
  BillingInterval.YEAR,
] as const;

/**
 * Paddle statuses that still grant the plan. `past_due` is included on
 * purpose: Paddle keeps retrying the card for days, and cutting an owner off
 * on the first failed charge punishes an expired card like a cancellation.
 * `paused` and `canceled` do not.
 */
const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isEntitledStatus(status: string): boolean {
  return ENTITLED_STATUSES.has(status);
}

export function isPaidPlan(plan: Plan): plan is PaidPlan {
  return plan !== Plan.FREE;
}

export function higherPlan(a: Plan, b: Plan): Plan {
  return PLAN_ORDER.indexOf(a) >= PLAN_ORDER.indexOf(b) ? a : b;
}

/**
 * The plan an owner actually has: the highest of their comp plan and every
 * subscription that is still entitled. Several can coexist briefly (a second
 * checkout before the first webhook landed); the owner gets the best one.
 */
export function effectivePlan(input: {
  compPlan: Plan | null;
  subscriptions: { plan: Plan; status: string }[];
}): Plan {
  return input.subscriptions
    .filter((sub) => isEntitledStatus(sub.status))
    .reduce<Plan>(
      (best, sub) => higherPlan(best, sub.plan),
      input.compPlan ?? Plan.FREE,
    );
}

/**
 * Over the limit never takes anything away — it only stops NEW properties.
 * An owner who downgrades or stops paying keeps every record they have.
 */
export function canAddProperty(plan: Plan, activeProperties: number): boolean {
  return activeProperties < PLANS[plan].propertyLimit;
}

/** Yearly price expressed per month, for the "US$8.33/mes" line. */
export function monthlyEquivalent(plan: PaidPlan): number {
  return Math.round((PLANS[plan].price.YEAR / 12) * 100) / 100;
}

/**
 * `US$10`, `US$8.33`. Formatted by hand rather than through ICU/`Intl`: the
 * catalogue's bare `es` locale would print `8,33` (Spain), and every market
 * this app sells to writes `8.33`.
 */
export function formatUsd(amount: number): string {
  return `US$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** Values interpolated into marketing copy that quotes prices, so the text can never drift from `PLANS`. */
export function pricingMessageParams() {
  return {
    freeLimit: PLANS.FREE.propertyLimit,
    proPrice: formatUsd(PLANS.PRO.price.MONTH),
    proLimit: PLANS.PRO.propertyLimit,
    businessPrice: formatUsd(PLANS.BUSINESS.price.MONTH),
    businessLimit: PLANS.BUSINESS.propertyLimit,
  };
}
