/**
 * Per-owner sequential receipt numbers, e.g. `REC-2026-0007`.
 *
 * Pure on purpose: the service does the (transactional) lookup of the highest
 * existing number, this decides what the next one is, and the rule can be
 * unit-tested without a database.
 */

/** Prefix every receipt of `year` shares. */
export function receiptNumberPrefix(year: number): string {
  return `REC-${year}-`;
}

/**
 * The next number after `latest` (the HIGHEST existing one for that year, or
 * null when the year has none yet).
 *
 * Derived from the highest number and NOT from a row count: payments can be
 * permanently deleted, so a count would reissue a number that is already live
 * and collide with `@@unique([ownerId, number])`.
 *
 * Zero-padded to 4 digits so a lexical `ORDER BY number DESC` — which is how
 * the caller finds `latest` — stays numerically correct up to 9999 per year.
 * A malformed or unparseable `latest` restarts at 1 rather than producing
 * `REC-2026-NaN`.
 */
export function nextReceiptNumber(
  latest: string | null | undefined,
  year: number,
): string {
  const prefix = receiptNumberPrefix(year);
  const sequence = latest?.startsWith(prefix)
    ? Number(latest.slice(prefix.length))
    : Number.NaN;
  const next = Number.isFinite(sequence) && sequence > 0 ? sequence + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}
