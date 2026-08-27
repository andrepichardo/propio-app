import { describe, expect, it } from 'vitest';
import {
  createPropertySchema,
  propertyFiltersSchema,
} from '../property.validators';

describe('createPropertySchema', () => {
  it('accepts a minimal property and applies defaults', () => {
    const result = createPropertySchema.safeParse({ name: 'Sunset 4B' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('TRADITIONAL_RENTAL');
      expect(result.data.status).toBe('AVAILABLE');
    }
  });

  it('rejects names that are too short', () => {
    expect(createPropertySchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('turns emptied optional strings into null so they clear', () => {
    // null, not undefined: Prisma reads `undefined` as "leave this column
    // alone", which made clearing an optional field impossible.
    const result = createPropertySchema.safeParse({
      name: 'Sunset 4B',
      city: '',
      description: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBeNull();
      expect(result.data.description).toBeNull();
    }
  });
});

describe('propertyFiltersSchema', () => {
  it('coerces query-string pagination values', () => {
    const result = propertyFiltersSchema.safeParse({
      page: '2',
      pageSize: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it('rejects unknown enum values instead of passing them to the DB', () => {
    expect(propertyFiltersSchema.safeParse({ status: 'HACKED' }).success).toBe(
      false,
    );
  });
});
