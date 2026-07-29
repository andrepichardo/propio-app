import { describe, expect, it } from 'vitest';
import {
  dateFormatPattern,
  isDateFormat,
  makeDateFormatter,
  toDateFormat,
} from '../date-format';

// UTC midnight — the shape date-only values are persisted in.
const sample = new Date(Date.UTC(2026, 6, 8)); // 8 July 2026

describe('dateFormatPattern', () => {
  it('numeric formats are locale-independent', () => {
    expect(dateFormatPattern('DMY', 'es')).toBe('dd/MM/yyyy');
    expect(dateFormatPattern('MDY', 'en')).toBe('MM/dd/yyyy');
    expect(dateFormatPattern('ISO', 'es')).toBe('yyyy-MM-dd');
  });

  it('LONG switches month-name order by locale', () => {
    expect(dateFormatPattern('LONG', 'es')).toBe("d 'de' MMMM 'de' yyyy");
    expect(dateFormatPattern('LONG', 'en')).toBe('MMMM d, yyyy');
  });
});

describe('makeDateFormatter', () => {
  it('renders each style for the sample date', () => {
    expect(makeDateFormatter('DMY', 'es')(sample)).toBe('08/07/2026');
    expect(makeDateFormatter('MDY', 'en')(sample)).toBe('07/08/2026');
    expect(makeDateFormatter('ISO', 'en')(sample)).toBe('2026-07-08');
    expect(makeDateFormatter('MEDIUM', 'en')(sample)).toBe('Jul 8, 2026');
    expect(makeDateFormatter('LONG', 'es')(sample)).toBe('8 de julio de 2026');
    expect(makeDateFormatter('LONG', 'en')(sample)).toBe('July 8, 2026');
  });

  it('returns a dash for empty values', () => {
    expect(makeDateFormatter('DMY', 'en')(null)).toBe('—');
    expect(makeDateFormatter('DMY', 'en')(undefined)).toBe('—');
  });
});

describe('toDateFormat / isDateFormat', () => {
  it('accepts known values and defaults the rest to MEDIUM', () => {
    expect(isDateFormat('DMY')).toBe(true);
    expect(isDateFormat('bogus')).toBe(false);
    expect(toDateFormat('ISO')).toBe('ISO');
    expect(toDateFormat('bogus')).toBe('MEDIUM');
    expect(toDateFormat(null)).toBe('MEDIUM');
  });
});
