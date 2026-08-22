import { describe, expect, it } from 'vitest';
import {
  nextReceiptNumber,
  receiptNumberPrefix,
} from '@/shared/lib/receipt-number';

describe('receiptNumberPrefix', () => {
  it('scopes numbering to the year', () => {
    expect(receiptNumberPrefix(2026)).toBe('REC-2026-');
  });
});

describe('nextReceiptNumber', () => {
  it('starts at 0001 for an owner with no receipts this year', () => {
    expect(nextReceiptNumber(null, 2026)).toBe('REC-2026-0001');
  });

  it('increments the highest existing number', () => {
    expect(nextReceiptNumber('REC-2026-0007', 2026)).toBe('REC-2026-0008');
  });

  it('does NOT reuse a number after a gap', () => {
    // The regression this guards: numbering used to come from a row COUNT.
    // Payments can be deleted permanently, so with 3 rows numbered 0001, 0002
    // and 0009, a count would propose 0004 — fine — but after deleting two of
    // them it would propose 0002, colliding with a live receipt. Deriving from
    // the maximum is gap-proof.
    expect(nextReceiptNumber('REC-2026-0009', 2026)).toBe('REC-2026-0010');
  });

  it('keeps the padding numeric-sortable across widths', () => {
    // Padding matters because the caller finds `latest` with a LEXICAL
    // `ORDER BY number DESC`; without it "REC-2026-9" would outrank
    // "REC-2026-10".
    expect(nextReceiptNumber('REC-2026-0099', 2026)).toBe('REC-2026-0100');
    expect(nextReceiptNumber('REC-2026-0999', 2026)).toBe('REC-2026-1000');
  });

  it('grows past the padding width instead of truncating', () => {
    expect(nextReceiptNumber('REC-2026-9999', 2026)).toBe('REC-2026-10000');
  });

  it('restarts numbering in a new year', () => {
    expect(nextReceiptNumber(null, 2027)).toBe('REC-2027-0001');
  });

  it('ignores a number belonging to another year', () => {
    // The caller filters by prefix, but a mismatch must not produce NaN.
    expect(nextReceiptNumber('REC-2025-0042', 2026)).toBe('REC-2026-0001');
  });

  it('falls back to 0001 on a malformed number rather than NaN', () => {
    expect(nextReceiptNumber('REC-2026-abc', 2026)).toBe('REC-2026-0001');
    expect(nextReceiptNumber('', 2026)).toBe('REC-2026-0001');
    expect(nextReceiptNumber(undefined, 2026)).toBe('REC-2026-0001');
  });
});
