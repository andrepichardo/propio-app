import { ExpenseCategory } from '@prisma/client';

/** Keys under `expenses.categories` are the enum values; translate with
 * `t(\`categories.${value}\`)`. */
export const EXPENSE_CATEGORY_VALUES = Object.values(ExpenseCategory);
