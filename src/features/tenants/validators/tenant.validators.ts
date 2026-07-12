import { z } from 'zod';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const tenantBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'firstNameRequired').max(80),
  lastName: z.string().trim().min(1, 'lastNameRequired').max(80),
  email: z
    .string()
    .trim()
    .email('emailInvalid')
    .optional()
    .or(z.literal('')),
  phone: optional(40),
  identification: optional(60),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  emergencyName: optional(120),
  emergencyPhone: optional(40),
  emergencyRelation: optional(60),
  notes: optional(2000),
});

export const createTenantSchema = tenantBaseSchema;
export const updateTenantSchema = tenantBaseSchema.partial().extend({
  id: z.string().cuid(),
});
export const deleteTenantSchema = z.object({ id: z.string().cuid() });

export const tenantFiltersSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantFilters = z.infer<typeof tenantFiltersSchema>;
