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

  it('normalises empty optional strings to undefined', () => {
    const result = createPropertySchema.safeParse({
      name: 'Sunset 4B',
      city: '',
      description: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBeUndefined();
      expect(result.data.description).toBeUndefined();
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
