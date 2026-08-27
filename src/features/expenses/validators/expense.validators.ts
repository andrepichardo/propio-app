import { z } from 'zod';
import { clearEmpty } from '@/shared/lib/validation';
import { ExpenseCategory } from '@/generated/prisma/enums';

export const expenseBaseSchema = z.object({
  propertyId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  category: z.nativeEnum(ExpenseCategory).default(ExpenseCategory.OTHER),
  description: z.string().trim().min(2, 'descriptionRequired').max(200),
  amount: z.coerce.number().positive('amountPositive').max(100_000_000),
  currency: z
    .string()
    .trim()
    .length(3, 'currencyCode')
    .transform((v) => v.toUpperCase())
    .default('USD'),
  incurredAt: z.coerce.date().default(() => new Date()),
  vendor: z.string().trim().max(120).nullish().transform(clearEmpty),
  notes: z.string().trim().max(2000).nullish().transform(clearEmpty),
  invoiceUrl: z.string().url().optional().or(z.literal('')),
});

export const createExpenseSchema = expenseBaseSchema;
export const updateExpenseSchema = expenseBaseSchema.partial().extend({
  id: z.string().cuid(),
});
export const deleteExpenseSchema = z.object({ id: z.string().cuid() });

export const expenseFiltersSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  propertyId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
