import { describe, expect, it } from 'vitest';
import { createContractSchema } from '../contract.validators';

const validInput = {
  propertyId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
  tenantId: 'clyyyyyyyyyyyyyyyyyyyyyyy',
  startDate: '2026-01-01',
  monthlyRent: 1200,
};

describe('createContractSchema', () => {
  it('accepts a minimal valid contract and applies defaults', () => {
    const result = createContractSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.dueDay).toBe(1);
      expect(result.data.securityDeposit).toBe(0);
      expect(result.data.status).toBe('ACTIVE');
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it('rejects an end date before the start date', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      endDate: '2025-12-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toBeDefined();
    }
  });

  it('rejects non-positive rent', () => {
    expect(
      createContractSchema.safeParse({ ...validInput, monthlyRent: 0 })
        .success,
    ).toBe(false);
    expect(
      createContractSchema.safeParse({ ...validInput, monthlyRent: -100 })
        .success,
    ).toBe(false);
  });

  it('rejects out-of-range due days', () => {
    expect(
      createContractSchema.safeParse({ ...validInput, dueDay: 0 }).success,
    ).toBe(false);
    expect(
      createContractSchema.safeParse({ ...validInput, dueDay: 32 }).success,
    ).toBe(false);
  });

  it('rejects malformed ids', () => {
    expect(
      createContractSchema.safeParse({ ...validInput, propertyId: 'nope' })
        .success,
    ).toBe(false);
  });
});
