import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  getInitials,
  toNumber,
} from '@/shared/lib/format';

describe('toNumber', () => {
  it('parses decimal strings coming from Prisma Decimal', () => {
    expect(toNumber('1200.50')).toBe(1200.5);
  });

  it('returns 0 for null, undefined and NaN inputs', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('not-a-number')).toBe(0);
  });

  it('passes numbers through', () => {
    expect(toNumber(42)).toBe(42);
  });
});

describe('formatCurrency', () => {
  it('formats USD with a bare $ and two decimals', () => {
    expect(formatCurrency(1200, 'USD')).toBe('$1,200.00');
  });

  it('accepts Decimal-style strings', () => {
    expect(formatCurrency('99.9', 'USD')).toBe('$99.90');
  });

  it('formats DOP with the RD$ prefix', () => {
    expect(formatCurrency(40_000, 'DOP')).toBe('RD$40,000.00');
  });

  it('keeps the sign in front of the symbol', () => {
    expect(formatCurrency(-1200, 'DOP')).toBe('-RD$1,200.00');
  });

  it('falls back to Intl for unlisted currencies', () => {
    expect(formatCurrency(50, 'JPY')).toContain('50');
  });
});

describe('formatPercent', () => {
  it('formats a ratio as a percentage', () => {
    expect(formatPercent(0.5)).toBe('50%');
  });
});

describe('formatDate', () => {
  it('formats a date with the default pattern', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('Jan 15, 2026');
  });

  it('returns an em dash for empty and invalid values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
});

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('María García')).toBe('MG');
  });

  it('handles single names and empty values', () => {
    expect(getInitials('Plato')).toBe('P');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('  ')).toBe('?');
  });
});
