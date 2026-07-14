import { z } from 'zod';
import { isPossiblePhoneNumber } from 'libphonenumber-js';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

/** E.164 from the phone input; legacy formatted values still parse. */
const phone = z
  .string()
  .trim()
  .max(20, 'phoneInvalid')
  .refine((v) => v === '' || isPossiblePhoneNumber(v), 'phoneInvalid')
  .optional()
  .transform((v) => (v === '' ? undefined : v));

/** Cédula (000-0000000-0) or passport: letters, digits and hyphens only. */
const identification = z
  .string()
  .trim()
  .max(20, 'identificationTooLong')
  .regex(/^[A-Za-z0-9-]*$/, 'identificationInvalid')
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
  phone,
  identification,
  avatarUrl: z.string().url().optional().or(z.literal('')),
  emergencyName: optional(120),
  emergencyPhone: phone,
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
