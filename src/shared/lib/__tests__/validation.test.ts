import { describe, expect, it } from 'vitest';
import { clearEmpty, optionalText } from '@/shared/lib/validation';
import { updateTenantSchema } from '@/features/tenants/validators/tenant.validators';
import { updateExpenseSchema } from '@/features/expenses/validators/expense.validators';
import { updateContractSchema } from '@/features/contracts/validators/contract.validators';
import { updatePaymentSchema } from '@/features/payments/validators/payment.validators';
import { updatePropertySchema } from '@/features/properties/validators/property.validators';

const CUID = 'clxxxxxxxxxxxxxxxxxxxxxxx';

describe('clearEmpty', () => {
  it('leaves an omitted field untouched', () => {
    // `undefined` must survive: Prisma reads it as "do not touch this column",
    // which is what a partial update wants for a field nobody sent.
    expect(clearEmpty(undefined)).toBeUndefined();
  });

  it('turns an emptied field into null so it is actually cleared', () => {
    expect(clearEmpty('')).toBeNull();
    expect(clearEmpty(null)).toBeNull();
  });

  it('passes a real value through', () => {
    expect(clearEmpty('hola')).toBe('hola');
  });
});

describe('optionalText', () => {
  const schema = optionalText(10);

  it('trims before deciding the field is empty', () => {
    expect(schema.parse('   ')).toBeNull();
    expect(schema.parse('  hola  ')).toBe('hola');
  });

  it('accepts null on the way in as well as out', () => {
    // The form may be typed from either side of the schema; both compile only
    // if null is valid input too.
    expect(schema.parse(null)).toBeNull();
  });

  it('still enforces the maximum length', () => {
    expect(schema.safeParse('x'.repeat(11)).success).toBe(false);
  });
});

describe('clearing an optional field (regression)', () => {
  // The bug: emptying an optional input reported "saved" and the old value
  // came back, because the schema mapped "" to `undefined` and Prisma treats
  // that as "leave this column alone". Every optional free-text field in the
  // app went through the same helper, so every one of them was affected.

  it('tenants: email, identification, phone and notes all clear', () => {
    const parsed = updateTenantSchema.parse({
      id: CUID,
      firstName: 'Nicole',
      lastName: 'Gómez',
      email: '',
      identification: '',
      phone: '',
      notes: '',
      emergencyName: '',
      emergencyRelation: '',
    });

    expect(parsed.email).toBeNull();
    expect(parsed.identification).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
    expect(parsed.emergencyName).toBeNull();
    expect(parsed.emergencyRelation).toBeNull();
  });

  it('tenants: a field the payload omits is left alone', () => {
    const parsed = updateTenantSchema.parse({
      id: CUID,
      firstName: 'Nicole',
      lastName: 'Gómez',
    });

    expect(parsed.email).toBeUndefined();
    expect(parsed.identification).toBeUndefined();
  });

  it('tenants: a real email still validates', () => {
    expect(
      updateTenantSchema.safeParse({ id: CUID, email: 'no-es-correo' }).success,
    ).toBe(false);
    const ok = updateTenantSchema.parse({ id: CUID, email: 'a@b.com' });
    expect(ok.email).toBe('a@b.com');
  });

  it('expenses: vendor and notes clear', () => {
    const parsed = updateExpenseSchema.parse({
      id: CUID,
      vendor: '',
      notes: '',
    });
    expect(parsed.vendor).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it('contracts: notes clears', () => {
    expect(
      updateContractSchema.parse({ id: CUID, notes: '' }).notes,
    ).toBeNull();
  });

  it('payments: reference, concept and notes clear', () => {
    const parsed = updatePaymentSchema.parse({
      id: CUID,
      amount: 1200,
      reference: '',
      concept: '',
      notes: '',
    });
    expect(parsed.reference).toBeNull();
    expect(parsed.concept).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it('properties: address and description fields clear', () => {
    const parsed = updatePropertySchema.parse({
      id: CUID,
      description: '',
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
    });
    expect(parsed.description).toBeNull();
    expect(parsed.addressLine).toBeNull();
    expect(parsed.city).toBeNull();
    expect(parsed.state).toBeNull();
    expect(parsed.postalCode).toBeNull();
  });
});
