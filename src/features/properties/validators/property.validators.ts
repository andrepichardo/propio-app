import { z } from 'zod';
import { PropertyStatus, PropertyType } from '@prisma/client';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

/** A number field that treats an empty input as "not set" (undefined), so
 * clearing it never coerces to 0. */
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    schema.optional(),
  );

export const propertyBaseSchema = z.object({
  name: z.string().trim().min(2, 'propertyNameMin').max(120),
  description: optionalTrimmed(2000),
  type: z.nativeEnum(PropertyType).default(PropertyType.TRADITIONAL_RENTAL),
  status: z.nativeEnum(PropertyStatus).default(PropertyStatus.AVAILABLE),
  addressLine: optionalTrimmed(200),
  city: optionalTrimmed(120),
  state: optionalTrimmed(120),
  postalCode: optionalTrimmed(20),
  country: optionalTrimmed(2),
  bedrooms: optionalNumber(z.coerce.number().int().min(0).max(100)),
  bathrooms: optionalNumber(z.coerce.number().int().min(0).max(100)),
  areaSqm: optionalNumber(z.coerce.number().min(0).max(1_000_000)),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

export const createPropertySchema = propertyBaseSchema;

export const updatePropertySchema = propertyBaseSchema.partial().extend({
  id: z.string().cuid(),
});

export const propertyFiltersSchema = z.object({
  search: z.string().trim().optional(),
  type: z.nativeEnum(PropertyType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'status']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const deletePropertySchema = z.object({ id: z.string().cuid() });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
