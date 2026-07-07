import { z } from 'zod';
import { ContractStatus } from '@prisma/client';

export const contractBaseSchema = z
  .object({
    propertyId: z.string().cuid('Select a property.'),
    tenantId: z.string().cuid('Select a tenant.'),
    startDate: z.coerce.date({ message: 'Start date is required.' }),
    endDate: z.coerce.date().optional().nullable(),
    monthlyRent: z.coerce
      .number()
      .positive('Rent must be greater than zero.')
      .max(100_000_000),
    currency: z.string().length(3).default('USD'),
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
  .refine(
    (data) => !data.endDate || data.endDate > data.startDate,
    {
      message: 'End date must be after the start date.',
      path: ['endDate'],
    },
  );

export const createContractSchema = contractBaseSchema;

export const updateContractSchema = z
  .object({
    id: z.string().cuid(),
    propertyId: z.string().cuid().optional(),
    tenantId: z.string().cuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    monthlyRent: z.coerce.number().positive().max(100_000_000).optional(),
    currency: z.string().length(3).optional(),
    dueDay: z.coerce.number().int().min(1).max(31).optional(),
    securityDeposit: z.coerce.number().min(0).max(100_000_000).optional(),
    maintenanceIncluded: z.boolean().optional(),
    status: z.nativeEnum(ContractStatus).optional(),
    notes: z.string().trim().max(2000).optional(),
  });

export const deleteContractSchema = z.object({ id: z.string().cuid() });

export const contractFiltersSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  propertyId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractFilters = z.infer<typeof contractFiltersSchema>;
