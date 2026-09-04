import { describe, expect, it } from 'vitest';
import {
  createContractSchema,
  renewContractSchema,
  updateContractSchema,
} from '../contract.validators';

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

  it('rejects an end date equal to the start date', () => {
    // A lease that starts and ends the same day covers no period at all.
    expect(
      createContractSchema.safeParse({
        ...validInput,
        endDate: validInput.startDate,
      }).success,
    ).toBe(false);
  });

  it('rejects non-positive rent', () => {
    expect(
      createContractSchema.safeParse({ ...validInput, monthlyRent: 0 }).success,
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

const validRenewal = {
  contractId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
  startDate: '2027-01-01',
  monthlyRent: 1320,
};

describe('renewContractSchema', () => {
  it('accepts a renewal with a new rent', () => {
    const result = renewContractSchema.safeParse(validRenewal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyRent).toBe(1320);
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it('accepts an open-ended renewal (month-to-month)', () => {
    const result = renewContractSchema.safeParse({
      ...validRenewal,
      endDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    expect(
      renewContractSchema.safeParse({
        ...validRenewal,
        endDate: '2026-06-01',
      }).success,
    ).toBe(false);
  });

  it('rejects a non-positive rent', () => {
    expect(
      renewContractSchema.safeParse({ ...validRenewal, monthlyRent: 0 })
        .success,
    ).toBe(false);
  });
});

const contractId = 'clxxxxxxxxxxxxxxxxxxxxxxx';

describe('updateContractSchema', () => {
  it('accepts a partial edit', () => {
    const result = updateContractSchema.safeParse({
      id: contractId,
      monthlyRent: 1500,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an end date before the start when both are sent', () => {
    const result = updateContractSchema.safeParse({
      id: contractId,
      startDate: '2026-05-01',
      endDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toBeDefined();
    }
  });

  it('rejects the two dates being equal', () => {
    expect(
      updateContractSchema.safeParse({
        id: contractId,
        startDate: '2026-05-01',
        endDate: '2026-05-01',
      }).success,
    ).toBe(false);
  });

  it('accepts clearing the end date (open-ended)', () => {
    const result = updateContractSchema.safeParse({
      id: contractId,
      startDate: '2026-05-01',
      endDate: null,
    });
    expect(result.success).toBe(true);
    // null must survive as null — undefined would tell Prisma to keep the old
    // value, so the lease could never be switched to open-ended.
    if (result.success) expect(result.data.endDate).toBeNull();
  });

  it('cannot judge an end date sent on its own — the service does', () => {
    // Documents the gap the schema structurally cannot close: with no start
    // date in the payload there is nothing here to compare against, which is
    // why contractService.update re-checks against the stored row.
    const result = updateContractSchema.safeParse({
      id: contractId,
      endDate: '1999-01-01',
    });
    expect(result.success).toBe(true);
  });
});
