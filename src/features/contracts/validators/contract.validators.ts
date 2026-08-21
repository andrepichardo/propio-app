import { z } from 'zod';
import { ContractStatus } from '@/generated/prisma/enums';

export const contractBaseSchema = z
  .object({
    propertyId: z.string().cuid('selectProperty'),
    tenantId: z.string().cuid('selectTenant'),
    startDate: z.coerce.date({ message: 'startDateRequired' }),
    endDate: z.coerce.date().optional().nullable(),
    monthlyRent: z.coerce.number().positive('rentPositive').max(100_000_000),
    currency: z
      .string()
      .trim()
      .length(3, 'currencyCode')
      .transform((v) => v.toUpperCase())
      .default('USD'),
    dueDay: z.coerce.number().int().min(1).max(31).default(1),
    securityDeposit: z.coerce.number().min(0).max(100_000_000).default(0),
    maintenanceIncluded: z.boolean().default(false),
    status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  })
  .refine((data) => !data.endDate || data.endDate > data.startDate, {
    message: 'endAfterStart',
    path: ['endDate'],
  });

export const createContractSchema = contractBaseSchema;

export const updateContractSchema = z.object({
  id: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  monthlyRent: z.coerce.number().positive().max(100_000_000).optional(),
  currency: z
    .string()
    .trim()
    .length(3, 'currencyCode')
    .transform((v) => v.toUpperCase())
    .optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  securityDeposit: z.coerce.number().min(0).max(100_000_000).optional(),
  maintenanceIncluded: z.boolean().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Renewing a contract creates a NEW one carrying the previous terms forward,
 * so only what actually changes is submitted. The rent is the source of truth
 * (a percentage bump is a UI helper that writes into it), because the increase
 * is sometimes a clean percentage and sometimes a negotiated figure.
 */
export const renewContractSchema = z
  .object({
    contractId: z.string().cuid(),
    startDate: z.coerce.date({ message: 'startDateRequired' }),
    endDate: z.coerce.date().optional().nullable(),
    monthlyRent: z.coerce.number().positive('rentPositive').max(100_000_000),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  })
  .refine((data) => !data.endDate || data.endDate > data.startDate, {
    message: 'endAfterStart',
    path: ['endDate'],
  });

export const deleteContractSchema = z.object({ id: z.string().cuid() });

export const contractFiltersSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  propertyId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type ContractFilters = z.infer<typeof contractFiltersSchema>;
