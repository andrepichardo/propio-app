import { describe, expect, it } from 'vitest';
import { BillingInterval, Plan } from '@/generated/prisma/enums';
import {
  type PaddleSubscriptionLike,
  toSubscriptionState,
} from '@/features/billing/lib/subscription-state';

const lookup = (priceId: string) =>
  priceId === 'pri_pro_year'
    ? { plan: Plan.PRO, interval: BillingInterval.YEAR }
    : null;

const base: PaddleSubscriptionLike = {
  id: 'sub_1',
  status: 'active',
  customerId: 'ctm_1',
  updatedAt: '2026-09-24T15:00:00.000Z',
  items: [{ price: { id: 'pri_pro_year' } }],
  currentBillingPeriod: {
    endsAt: '2027-09-24T15:00:00.000Z',
  },
  scheduledChange: null,
  customData: { ownerId: 'owner_1' },
};

describe('toSubscriptionState', () => {
  it('maps a live subscription', () => {
    const result = toSubscriptionState(base, lookup);
    expect(result).toEqual({
      ok: true,
      state: {
        paddleSubscriptionId: 'sub_1',
        paddleCustomerId: 'ctm_1',
        paddlePriceId: 'pri_pro_year',
        plan: Plan.PRO,
        interval: BillingInterval.YEAR,
        status: 'active',
        currentPeriodEnd: new Date('2027-09-24T15:00:00.000Z'),
        cancelAtPeriodEnd: false,
        lastEventAt: new Date('2026-09-24T15:00:00.000Z'),
        ownerId: 'owner_1',
      },
    });
  });

  it('flags a cancellation scheduled for the end of the period', () => {
    const result = toSubscriptionState(
      { ...base, scheduledChange: { action: 'cancel' } },
      lookup,
    );
    expect(result.ok && result.state.cancelAtPeriodEnd).toBe(true);
  });

  it('does not treat a scheduled pause as a cancellation', () => {
    const result = toSubscriptionState(
      { ...base, scheduledChange: { action: 'pause' } },
      lookup,
    );
    expect(result.ok && result.state.cancelAtPeriodEnd).toBe(false);
  });

  it('refuses a price it does not sell', () => {
    expect(
      toSubscriptionState(
        { ...base, items: [{ price: { id: 'pri_other' } }] },
        lookup,
      ),
    ).toEqual({ ok: false, reason: 'unknown_price', priceId: 'pri_other' });
    expect(toSubscriptionState({ ...base, items: [] }, lookup)).toEqual({
      ok: false,
      reason: 'no_price',
    });
  });

  it('ignores a missing or malformed ownerId', () => {
    for (const customData of [null, {}, { ownerId: 42 }, { ownerId: '' }]) {
      const result = toSubscriptionState({ ...base, customData }, lookup);
      expect(result.ok && result.state.ownerId).toBeNull();
    }
  });

  it('keeps a canceled subscription with no billing period', () => {
    const result = toSubscriptionState(
      { ...base, status: 'canceled', currentBillingPeriod: null },
      lookup,
    );
    expect(result.ok && result.state.currentPeriodEnd).toBeNull();
    expect(result.ok && result.state.status).toBe('canceled');
  });
});
