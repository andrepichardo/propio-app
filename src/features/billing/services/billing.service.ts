import 'server-only';
import { getTranslations } from 'next-intl/server';
import { ApiError } from '@paddle/paddle-node-sdk';
import type { BillingInterval, Plan } from '@/generated/prisma/enums';
import { AppError, ConflictError, PlanLimitError } from '@/shared/lib/errors';
import { propertyRepository } from '@/features/properties/repositories/property.repository';
import { subscriptionRepository } from '../repositories/subscription.repository';
import {
  getPaddle,
  getPriceIds,
  isBillingConfigured,
  planForPriceId,
} from '../lib/paddle';
import {
  type PaddleSubscriptionLike,
  toSubscriptionState,
} from '../lib/subscription-state';
import {
  canAddProperty,
  effectivePlan,
  isEntitledStatus,
  type PaidPlan,
  PLANS,
} from '../plans';

export type Entitlements = {
  plan: Plan;
  propertyLimit: number;
  propertyCount: number;
  canAddProperty: boolean;
};

async function billingError(
  key: 'unavailable' | 'paddleFailed' | 'noSubscription',
) {
  const t = await getTranslations('billing.errors');
  return new AppError(t(key), 'BILLING_ERROR', 502);
}

/** The subscription plan changes and the portal act on: the newest one still granting a plan. */
async function liveSubscription(ownerId: string) {
  const subscriptions = await subscriptionRepository.forOwner(ownerId);
  return subscriptions.find((sub) => isEntitledStatus(sub.status)) ?? null;
}

export const billingService = {
  async entitlements(ownerId: string): Promise<Entitlements> {
    const [inputs, propertyCount] = await Promise.all([
      subscriptionRepository.planInputs(ownerId),
      propertyRepository.countActive(ownerId),
    ]);
    const plan = effectivePlan(inputs);
    return {
      plan,
      propertyLimit: PLANS[plan].propertyLimit,
      propertyCount,
      canAddProperty: canAddProperty(plan, propertyCount),
    };
  },

  /**
   * The guarantee behind the property limit. The new-property page checks it
   * too, but a stale tab or a second tab can still submit.
   */
  async assertCanAddProperty(ownerId: string) {
    const current = await this.entitlements(ownerId);
    if (current.canAddProperty) return;
    const t = await getTranslations('billing.errors');
    throw new PlanLimitError(
      t('propertyLimit', { limit: current.propertyLimit }),
    );
  },

  async overview(ownerId: string) {
    const [entitlements, inputs, subscriptions] = await Promise.all([
      this.entitlements(ownerId),
      subscriptionRepository.planInputs(ownerId),
      subscriptionRepository.forOwner(ownerId),
    ]);
    const live = subscriptions.find((sub) => isEntitledStatus(sub.status));
    return {
      ...entitlements,
      compPlan: inputs.compPlan,
      configured: isBillingConfigured(),
      priceIds: getPriceIds(),
      // A lapsed subscriber still has invoices to download in the portal.
      hasBillingAccount: subscriptions.length > 0,
      subscription: live
        ? {
            plan: live.plan as PaidPlan,
            interval: live.interval,
            status: live.status,
            currentPeriodEnd: live.currentPeriodEnd,
            cancelAtPeriodEnd: live.cancelAtPeriodEnd,
          }
        : null,
    };
  },

  /**
   * Move an existing subscription to another plan or interval. Never a second
   * checkout: that would leave the owner paying for two subscriptions.
   * Prorated immediately, so an upgrade charges the difference today and a
   * downgrade credits it against the next bills. Choosing a plan also lifts a
   * pending cancellation — picking one is asking to stay.
   */
  async changePlan(ownerId: string, plan: PaidPlan, interval: BillingInterval) {
    const paddle = getPaddle();
    const priceIds = getPriceIds();
    if (!paddle || !priceIds) throw await billingError('unavailable');

    const current = await liveSubscription(ownerId);
    if (!current) throw await billingError('noSubscription');

    const priceId = priceIds[plan][interval];
    if (current.paddlePriceId === priceId && !current.cancelAtPeriodEnd) {
      const t = await getTranslations('billing.errors');
      throw new ConflictError(t('samePlan'));
    }

    try {
      const updated = await paddle.subscriptions.update(
        current.paddleSubscriptionId,
        {
          items: [{ priceId, quantity: 1 }],
          prorationBillingMode: 'prorated_immediately',
          ...(current.cancelAtPeriodEnd ? { scheduledChange: null } : {}),
        },
      );
      // The webhook will say the same thing; writing it now keeps the page
      // from showing the old plan until it arrives.
      await this.applyPaddleSubscription(updated);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(
          '[billing] plan change rejected',
          error.code,
          error.detail,
        );
        throw await billingError('paddleFailed');
      }
      throw error;
    }
  },

  /** A one-time link to Paddle's portal: card, invoices, cancellation. */
  async portalUrl(ownerId: string): Promise<string> {
    const paddle = getPaddle();
    if (!paddle) throw await billingError('unavailable');

    const subscriptions = await subscriptionRepository.forOwner(ownerId);
    const latest = subscriptions[0];
    if (!latest) throw await billingError('noSubscription');

    try {
      const session = await paddle.customerPortalSessions.create(
        latest.paddleCustomerId,
        subscriptions
          .filter((sub) => isEntitledStatus(sub.status))
          .map((sub) => sub.paddleSubscriptionId),
      );
      return session.urls.general.overview;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(
          '[billing] portal session failed',
          error.code,
          error.detail,
        );
        throw await billingError('paddleFailed');
      }
      throw error;
    }
  },

  /**
   * Mirror one Paddle subscription locally. `unknown_price` is thrown so the
   * webhook answers 500 and Paddle retries: it means the env is missing a
   * price id, and a paying customer must not be dropped while that is fixed.
   */
  async applyPaddleSubscription(sub: PaddleSubscriptionLike) {
    const result = toSubscriptionState(sub, planForPriceId);
    if (!result.ok) {
      if (result.reason === 'unknown_price') {
        throw new Error(
          `[billing] subscription ${sub.id} uses unknown price ${result.priceId}`,
        );
      }
      console.warn(`[billing] subscription ${sub.id} has no price; ignored`);
      return 'ignored' as const;
    }

    const outcome = await subscriptionRepository.applyState(result.state);
    if (outcome === 'no_owner') {
      console.error(
        `[billing] subscription ${sub.id} (customer ${sub.customerId}) has no known owner`,
      );
    }
    return outcome;
  },
};
