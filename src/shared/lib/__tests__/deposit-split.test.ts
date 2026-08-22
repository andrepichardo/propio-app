import { describe, expect, it } from 'vitest';
import { splitDeposit } from '@/shared/lib/deposit-split';

const HELD = 1200;

describe('splitDeposit', () => {
  it('returns everything when nothing is retained', () => {
    const split = splitDeposit(HELD, 0);
    expect(split).toEqual({
      ok: true,
      amountRetained: 0,
      amountReturned: HELD,
    });
  });

  it('returns the remainder when part is retained', () => {
    const split = splitDeposit(HELD, 300);
    expect(split).toEqual({
      ok: true,
      amountRetained: 300,
      amountReturned: 900,
    });
  });

  it('returns nothing when the whole deposit is retained', () => {
    const split = splitDeposit(HELD, HELD);
    expect(split).toEqual({
      ok: true,
      amountRetained: HELD,
      amountReturned: 0,
    });
  });

  it('always adds back up to what was held', () => {
    // The invariant the accounting depends on: retained becomes income, the
    // rest is the tenant's money. If they stop summing to `held`, revenue is
    // misstated.
    for (const retained of [0, 0.01, 1, 599.99, 600, 1199.99, HELD]) {
      const split = splitDeposit(HELD, retained);
      expect(split.ok).toBe(true);
      if (split.ok) {
        expect(split.amountRetained + split.amountReturned).toBeCloseTo(
          HELD,
          10,
        );
      }
    }
  });

  it('rejects retaining more than was collected', () => {
    expect(splitDeposit(HELD, HELD + 0.01)).toEqual({
      ok: false,
      reason: 'retainedExceedsHeld',
    });
  });

  it('rejects settling when no deposit was collected', () => {
    expect(splitDeposit(0, 0)).toEqual({ ok: false, reason: 'noDeposit' });
    expect(splitDeposit(-100, 0)).toEqual({ ok: false, reason: 'noDeposit' });
  });

  it('reports noDeposit before retainedExceedsHeld', () => {
    // Order matters for the message the owner sees: with nothing collected,
    // "you cannot retain more than was collected" would be confusing.
    expect(splitDeposit(0, 500)).toEqual({ ok: false, reason: 'noDeposit' });
  });
});
