/**
 * How a deposit settlement divides the money that was collected.
 *
 * The returned amount is DERIVED, never entered by the owner, so the two parts
 * always add back up to what was held. Accounting-wise they are different
 * things: the retained part becomes income on the settlement date, while the
 * returned part is the tenant's own money and touches neither income nor
 * expenses — which is why an arithmetic slip here misstates revenue.
 *
 * Pure, so the boundaries are unit-testable; the service maps `reason` to its
 * typed errors.
 */
export type DepositSplit =
  | { ok: true; amountRetained: number; amountReturned: number }
  | { ok: false; reason: 'noDeposit' | 'retainedExceedsHeld' };

export function splitDeposit(
  held: number,
  amountRetained: number,
): DepositSplit {
  if (!(held > 0)) return { ok: false, reason: 'noDeposit' };
  if (amountRetained > held) {
    return { ok: false, reason: 'retainedExceedsHeld' };
  }
  return { ok: true, amountRetained, amountReturned: held - amountRetained };
}
