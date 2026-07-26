import { z } from 'zod';

export const generateStatementSchema = z.object({
  contractId: z.string().cuid('Select a contract.'),
  /** Any date within the month to generate the statement for. */
  month: z.coerce.date({ message: 'Select a month.' }),
});

export const deleteStatementSchema = z.object({ id: z.string().cuid() });

export const statementFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type GenerateStatementInput = z.infer<typeof generateStatementSchema>;
export type StatementFilters = z.infer<typeof statementFiltersSchema>;
