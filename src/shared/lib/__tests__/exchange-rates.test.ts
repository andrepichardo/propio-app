import { describe, expect, it } from 'vitest';
import { makeConverter } from '@/shared/lib/exchange-rates';

// Units per 1 USD, shaped like the open.er-api.com payload.
const RATES = { USD: 1, DOP: 60, EUR: 0.9 };

describe('makeConverter', () => {
  it('passes an amount in the target currency through untouched', () => {
    const convert = makeConverter(RATES, 'DOP');

    expect(convert(1500, 'DOP')).toBe(1500);
    expect(convert.canConvert('DOP')).toBe(true);
    expect(convert.missing.size).toBe(0);
  });

  it('converts via the USD cross-rate', () => {
    const toDop = makeConverter(RATES, 'DOP');
    const toUsd = makeConverter(RATES, 'USD');

    expect(toDop(100, 'USD')).toBe(6000);
    expect(toUsd(6000, 'DOP')).toBe(100);
    // Neither leg is USD: 90 EUR → 100 USD → 6000 DOP.
    expect(toDop(90, 'EUR')).toBeCloseTo(6000, 6);
  });

  it('records a currency it has no rate for instead of silently faking one', () => {
    const convert = makeConverter(RATES, 'DOP');

    // Falls back to 1:1 so the total is never dropped...
    expect(convert(500, 'JPY')).toBe(500);
    // ...but says so, which is what stops the UI showing a bogus ≈.
    expect(convert.canConvert('JPY')).toBe(false);
    expect([...convert.missing]).toEqual(['JPY']);
  });

  it('reports every currency as unconvertible when the rates API failed', () => {
    // getUsdRates() returns {} on any failure — the case that used to produce
    // a wrong total wearing an ≈.
    const convert = makeConverter({}, 'DOP');

    expect(convert(100, 'USD')).toBe(100);
    expect(convert.canConvert('USD')).toBe(false);
    expect([...convert.missing]).toEqual(['USD']);
  });

  it('still treats the target currency as convertible with no rates at all', () => {
    // Nothing to convert, so an owner with a single currency sees no warning
    // even while the rates service is down.
    const convert = makeConverter({}, 'DOP');

    expect(convert(100, 'DOP')).toBe(100);
    expect(convert.canConvert('DOP')).toBe(true);
    expect(convert.missing.size).toBe(0);
  });

  it('does not record a miss for a zero amount', () => {
    const convert = makeConverter(RATES, 'DOP');

    expect(convert(0, 'JPY')).toBe(0);
    expect(convert.missing.size).toBe(0);
  });

  it('accumulates misses across currencies without duplicates', () => {
    const convert = makeConverter(RATES, 'USD');

    convert(10, 'JPY');
    convert(20, 'JPY');
    convert(30, 'COP');

    expect([...convert.missing].sort()).toEqual(['COP', 'JPY']);
  });
});
