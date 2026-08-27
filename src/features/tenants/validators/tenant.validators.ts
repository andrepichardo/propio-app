import { z } from 'zod';
import { clearEmpty, optionalText } from '@/shared/lib/validation';
import { isPossiblePhoneNumber } from 'libphonenumber-js';

/** E.164 from the phone input; legacy formatted values still parse. */
const phone = z
  .string()
  .trim()
  .max(20, 'phoneInvalid')
  .refine((v) => v === '' || isPossiblePhoneNumber(v), 'phoneInvalid')
  .nullish()
  .transform(clearEmpty);

/** Cédula (000-0000000-0) or passport: letters, digits and hyphens only. */
const identification = z
  .string()
  .trim()
  .max(20, 'identificationTooLong')
  .regex(/^[A-Za-z0-9-]*$/, 'identificationInvalid')
  .nullish()
  .transform(clearEmpty);

export const tenantBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'firstNameRequired').max(80),
  lastName: z.string().trim().min(1, 'lastNameRequired').max(80),
  email: z
    .union([z.string().trim().email('emailInvalid'), z.literal('')])
    .nullish()
    .transform(clearEmpty),
  phone,
  identification,
  avatarUrl: z.string().url().optional().or(z.literal('')),
  emergencyName: optionalText(120),
  emergencyPhone: phone,
  emergencyRelation: optionalText(60),
  notes: optionalText(2000),
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
