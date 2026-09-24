import 'server-only';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { BillingInterval, Plan } from '@/generated/prisma/enums';
import { env } from '@/shared/config/env';
import type { PaidPlan, PriceIds } from '../plans';

/**
 * The four Paddle price ids, or null when any is missing. All-or-nothing on
 * purpose: a half-configured catalogue would sell one plan and fail the next.
 */
export function getPriceIds(): PriceIds | null {
  const ids = {
    [Plan.PRO]: {
      [BillingInterval.MONTH]: env.PADDLE_PRICE_PRO_MONTHLY,
      [BillingInterval.YEAR]: env.PADDLE_PRICE_PRO_YEARLY,
    },
    [Plan.BUSINESS]: {
      [BillingInterval.MONTH]: env.PADDLE_PRICE_BUSINESS_MONTHLY,
      [BillingInterval.YEAR]: env.PADDLE_PRICE_BUSINESS_YEARLY,
    },
  };
  const all = Object.values(ids).flatMap((byInterval) =>
    Object.values(byInterval),
  );
  return all.every(Boolean) ? (ids as PriceIds) : null;
}

/** Reverse lookup for webhooks: which plan/interval a Paddle price sells. */
export function planForPriceId(
  priceId: string,
): { plan: PaidPlan; interval: BillingInterval } | null {
  const ids = getPriceIds();
  if (!ids) return null;
  for (const plan of [Plan.PRO, Plan.BUSINESS] as const) {
    for (const interval of [BillingInterval.MONTH, BillingInterval.YEAR]) {
      if (ids[plan][interval] === priceId) return { plan, interval };
    }
  }
  return null;
}

export function isBillingConfigured(): boolean {
  return Boolean(
    env.PADDLE_API_KEY &&
    env.PADDLE_WEBHOOK_SECRET &&
    env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
    getPriceIds(),
  );
}

let client: Paddle | null = null;

/** The server SDK. Also required for webhooks: its constructor registers the crypto runtime they verify with. */
export function getPaddle(): Paddle | null {
  if (!env.PADDLE_API_KEY) return null;
  client ??= new Paddle(env.PADDLE_API_KEY, {
    environment:
      env.NEXT_PUBLIC_PADDLE_ENV === 'production'
        ? Environment.production
        : Environment.sandbox,
  });
  return client;
}
