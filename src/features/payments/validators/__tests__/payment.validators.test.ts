import { describe, expect, it } from 'vitest';
import { registerPaymentSchema } from '../payment.validators';

const validInput = {
  contractId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
  amount: 1200,
};

describe('registerPaymentSchema', () => {
  it('accepts a minimal payment and applies defaults', () => {
    const result = registerPaymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe('TRANSFER');
      expect(result.data.paidAt).toBeInstanceOf(Date);
      expect(result.data.sendReceipt).toBe(false);
    }
  });

  it('rejects non-positive amounts', () => {
    expect(
      registerPaymentSchema.safeParse({ ...validInput, amount: 0 }).success,
    ).toBe(false);
    expect(
      registerPaymentSchema.safeParse({ ...validInput, amount: -50 }).success,
    ).toBe(false);
  });

  it('coerces numeric strings from form inputs', () => {
    const result = registerPaymentSchema.safeParse({
      ...validInput,
      amount: '850.25',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(850.25);
  });

  it('normalises empty optional strings to undefined', () => {
    const result = registerPaymentSchema.safeParse({
      ...validInput,
      reference: '',
      concept: '',
      notes: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reference).toBeUndefined();
      expect(result.data.concept).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });

  it('rejects unknown payment methods', () => {
    expect(
      registerPaymentSchema.safeParse({ ...validInput, method: 'BITCOIN' })
        .success,
    ).toBe(false);
  });
});
