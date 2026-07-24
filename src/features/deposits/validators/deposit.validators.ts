import { z } from 'zod';

/**
 * Settling a deposit at handover. The owner enters how much they keep (for
 * damages, cleaning, unpaid rent…); the returned amount is derived from the
 * deposit actually collected, so the two can never drift apart.
 */
export const settleDepositSchema = z.object({
  contractId: z.string().cuid(),
  amountRetained: z.coerce
    .number()
    .min(0, 'amountNotNegative')
    .max(100_000_000),
  reason: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  settledAt: z.coerce.date().default(() => new Date()),
});

export type SettleDepositInput = z.infer<typeof settleDepositSchema>;
