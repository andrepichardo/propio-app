import { describe, expect, it } from 'vitest';
import { numberLocale, toLocale } from '@/i18n/config';
import { formatCurrency } from '@/shared/lib/format';

describe('toLocale', () => {
  it('passes through a catalog locale', () => {
    expect(toLocale('en')).toBe('en');
    expect(toLocale('es')).toBe('es');
  });

  it('narrows a BCP-47 tag to its primary subtag', () => {
    expect(toLocale('es-DO')).toBe('es');
    expect(toLocale('en-US')).toBe('en');
  });

  it('falls back to the default for anything unsupported', () => {
    expect(toLocale('fr')).toBe('en');
    expect(toLocale('')).toBe('en');
    expect(toLocale(null)).toBe('en');
    expect(toLocale(undefined)).toBe('en');
  });
});

describe('numberLocale', () => {
  it('maps Spanish to es-DO, never bare es', () => {
    // The regression this guards: `setLocale` stores 'es', and passing that
    // straight to Intl formats as SPAIN — 40.000,00 — while every market this
    // app serves writes 40,000.00. It shipped that way in the receipt email
    // and the statement PDF while the receipt PDF mapped correctly, so the
    // same amount reached a tenant formatted two different ways.
    expect(numberLocale('es')).toBe('es-DO');
    expect(numberLocale('es-DO')).toBe('es-DO');
  });

  it('maps English to en-US', () => {
    expect(numberLocale('en')).toBe('en-US');
    expect(numberLocale('en-US')).toBe('en-US');
  });

  it('groups thousands the Latin-American way', () => {
    expect(formatCurrency(40000, 'DOP', numberLocale('es'))).toBe(
      'RD$40,000.00',
    );
    expect(formatCurrency(40000, 'DOP', numberLocale('en'))).toBe(
      'RD$40,000.00',
    );
  });
});
