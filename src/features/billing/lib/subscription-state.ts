import type { BillingInterval } from '@/generated/prisma/enums';
import type { PaidPlan } from '../plans';

/**
 * The fields read from a Paddle subscription. Both the webhook payload and the
 * API response (`subscriptions.update`) satisfy it, so one translation serves
 * both writers.
 */
export type PaddleSubscriptionLike = {
  id: string;
  status: string;
  customerId: string;
  updatedAt: string;
  items: { price: { id: string } | null }[];
  currentBillingPeriod: { endsAt: string } | null;
  scheduledChange: { action: string } | null;
  customData: Record<string, unknown> | null;
};

export type SubscriptionState = {
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  paddlePriceId: string;
  plan: PaidPlan;
  interval: BillingInterval;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  lastEventAt: Date;
  /** From checkout `customData`; only present when Paddle carried it over. */
  ownerId: string | null;
};

export type ToStateResult =
  | { ok: true; state: SubscriptionState }
  | { ok: false; reason: 'no_price' | 'unknown_price'; priceId?: string };

/**
 * Translate a Paddle subscription into the local row. Pure: the price lookup
 * is injected so this can be unit-tested without Paddle env vars.
 *
 * `lastEventAt` is the subscription's OWN `updatedAt`, not the webhook's
 * delivery time — it orders the webhook and the API writer on the same clock.
 */
export function toSubscriptionState(
  sub: PaddleSubscriptionLike,
  planForPriceId: (
    priceId: string,
  ) => { plan: PaidPlan; interval: BillingInterval } | null,
): ToStateResult {
  const priceId = sub.items.find((item) => item.price)?.price?.id;
  if (!priceId) return { ok: false, reason: 'no_price' };

  const match = planForPriceId(priceId);
  if (!match) return { ok: false, reason: 'unknown_price', priceId };

  const ownerId = sub.customData?.ownerId;

  return {
    ok: true,
    state: {
      paddleSubscriptionId: sub.id,
      paddleCustomerId: sub.customerId,
      paddlePriceId: priceId,
      plan: match.plan,
      interval: match.interval,
      status: sub.status,
      currentPeriodEnd: sub.currentBillingPeriod
        ? new Date(sub.currentBillingPeriod.endsAt)
        : null,
      cancelAtPeriodEnd: sub.scheduledChange?.action === 'cancel',
      lastEventAt: new Date(sub.updatedAt),
      ownerId: typeof ownerId === 'string' && ownerId ? ownerId : null,
    },
  };
}
