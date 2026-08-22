/**
 * Rules deciding when a rent period counts as settled, and what balance a
 * payment leaves behind.
 *
 * These live together because they are two halves of ONE invariant, applied in
 * different features: `payment.service` decides the balance stored on the
 * receipt, and `dashboard.service` decides whether a month still shows up in
 * "upcoming payments". If they ever disagree, a tenant sees a receipt saying
 * they owe nothing while the dashboard keeps asking for the same month.
 *
 * Pure and free of server-only imports, so the invariant is unit-testable.
 */

/**
 * Whether this payment marks its rent period fully settled.
 *
 * A DEPOSIT never settles a rent period — it is the tenant's own money held as
 * a liability, not rent — so the flag is ignored for it, no matter what the
 * form sent.
 */
export function settlesRentPeriod(
  isDeposit: boolean,
  requested: boolean,
): boolean {
  return !isDeposit && requested;
}

/**
 * Rent still owed for the period after this payment.
 *
 * Zero when the payment is a deposit (it settles no rent) or when the period
 * was explicitly marked settled — that is the whole point of `settlesPeriod`:
 * an agreed amount BELOW the rent (a discount) that still closes the month.
 * Otherwise it is the shortfall, never negative: overpaying leaves 0, not
 * credit.
 */
export function rentBalanceAfter(input: {
  amount: number;
  monthlyRent: number;
  isDeposit: boolean;
  settlesPeriod: boolean;
}): number {
  const { amount, monthlyRent, isDeposit, settlesPeriod } = input;
  if (isDeposit || settlesPeriod) return 0;
  return Math.max(0, monthlyRent - amount);
}

/**
 * Whether a contract's month needs no further payment.
 *
 * Covered when the month was marked settled by any of its payments, OR enough
 * money landed in it. The comparison is `>=`, not `===`, because an
 * overpayment also covers the month.
 */
export function isPeriodCovered(input: {
  paid: number;
  monthlyRent: number;
  settled: boolean;
}): boolean {
  const { paid, monthlyRent, settled } = input;
  return settled || paid >= monthlyRent;
}
