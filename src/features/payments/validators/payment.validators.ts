import { z } from 'zod';
import { PaymentMethod, PaymentType } from '@prisma/client';

export const registerPaymentSchema = z.object({
  contractId: z.string().cuid('selectContract'),
  amount: z.coerce
    .number()
    .positive('amountPositive')
    .max(100_000_000),
  type: z.nativeEnum(PaymentType).default(PaymentType.RENT),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.TRANSFER),
  reference: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  concept: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  paidAt: z.coerce.date().default(() => new Date()),
  /** First day of the rent period this payment settles. */
  periodStart: z.coerce.date().optional(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  /** Storage URL of an uploaded proof of payment, set by the upload action. */
  proofUrl: z.string().url().optional().or(z.literal('')),
  /** Whether to email the receipt PDF to the tenant. */
  sendReceipt: z.boolean().default(false),
});

/**
 * Correcting a recorded payment. The contract can't change — that would move
 * the money to a different tenant/property and invalidate the issued receipt;
 * void and re-register instead.
 */
export const updatePaymentSchema = registerPaymentSchema
  .omit({ contractId: true, sendReceipt: true })
  .extend({ id: z.string().cuid() });

export const deletePaymentSchema = z.object({ id: z.string().cuid() });

export const paymentFiltersSchema = z.object({
  contractId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
