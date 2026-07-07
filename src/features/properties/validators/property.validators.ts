import { z } from 'zod';
import { PropertyStatus, PropertyType } from '@prisma/client';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const propertyBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(120),
  description: optionalTrimmed(2000),
  type: z.nativeEnum(PropertyType).default(PropertyType.TRADITIONAL_RENTAL),
  status: z.nativeEnum(PropertyStatus).default(PropertyStatus.AVAILABLE),
  addressLine: optionalTrimmed(200),
  city: optionalTrimmed(120),
  state: optionalTrimmed(120),
  postalCode: optionalTrimmed(20),
  country: optionalTrimmed(2),
  bedrooms: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .or(z.literal(undefined)),
  bathrooms: z.coerce.number().int().min(0).max(100).optional(),
  areaSqm: z.coerce.number().min(0).max(1_000_000).optional(),
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
