import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const registerPaymentSchema = z.object({
  contractId: z.string().cuid('Select a contract.'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than zero.')
    .max(100_000_000),
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
  /** Whether to email the receipt PDF to the tenant. */
  sendReceipt: z.boolean().default(false),
});

export const deletePaymentSchema = z.object({ id: z.string().cuid() });

export const paymentFiltersSchema = z.object({
  contractId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
