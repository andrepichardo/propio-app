import { describe, expect, it } from 'vitest';
import { settleDepositSchema } from '../deposit.validators';

const validInput = {
  contractId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
  amountRetained: 0,
};

describe('settleDepositSchema', () => {
  it('accepts a full return (nothing retained) and defaults the date', () => {
    const result = settleDepositSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountRetained).toBe(0);
      expect(result.data.settledAt).toBeInstanceOf(Date);
    }
  });

  it('rejects a negative retained amount', () => {
    expect(
      settleDepositSchema.safeParse({ ...validInput, amountRetained: -1 })
        .success,
    ).toBe(false);
  });

  it('coerces numeric strings from form inputs', () => {
    const result = settleDepositSchema.safeParse({
      ...validInput,
      amountRetained: '250.50',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amountRetained).toBe(250.5);
  });

  it('normalises an empty reason to undefined', () => {
    const result = settleDepositSchema.safeParse({
      ...validInput,
      reason: '',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBeUndefined();
  });

  it('requires a contract id', () => {
    expect(settleDepositSchema.safeParse({ amountRetained: 0 }).success).toBe(
      false,
    );
  });
});
