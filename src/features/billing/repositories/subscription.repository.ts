import 'server-only';
import { prisma } from '@/shared/lib/prisma';
import type { SubscriptionState } from '../lib/subscription-state';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

export type ApplyResult = 'created' | 'updated' | 'stale' | 'no_owner';

/**
 * Subscription data access. The only writer is `applyState`, fed by the
 * Paddle webhook and by the plan-change action with Paddle's own response.
 */
export const subscriptionRepository = {
  forOwner(ownerId: string) {
    return prisma.subscription.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async planInputs(ownerId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: {
        compPlan: true,
        subscriptions: { select: { plan: true, status: true } },
      },
    });
    return { compPlan: user.compPlan, subscriptions: user.subscriptions };
  },

  /**
   * Write Paddle's view of a subscription, ignoring anything older than what
   * is stored — Paddle does not guarantee delivery order, and a late
   * `past_due` must not overwrite the `active` that followed it.
   *
   * The owner comes from the stored row when there is one, and otherwise from
   * checkout `customData`; a subscription that carries neither is reported,
   * not guessed.
   */
  async applyState(state: SubscriptionState): Promise<ApplyResult> {
    const { ownerId, ...fields } = state;

    const updated = await prisma.subscription.updateMany({
      where: {
        paddleSubscriptionId: state.paddleSubscriptionId,
        lastEventAt: { lte: state.lastEventAt },
      },
      data: fields,
    });
    if (updated.count > 0) return 'updated';

    const existing = await prisma.subscription.findUnique({
      where: { paddleSubscriptionId: state.paddleSubscriptionId },
      select: { id: true },
    });
    if (existing) return 'stale';

    if (!ownerId) return 'no_owner';
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });
    if (!owner) return 'no_owner';

    try {
      await prisma.subscription.create({ data: { ...fields, ownerId } });
      return 'created';
    } catch (error) {
      // Two deliveries of the same new subscription raced; the loser retries
      // as an ordinary update.
      if (!isUniqueViolation(error)) throw error;
      return this.applyState(state);
    }
  },
};
