import { ExpenseCategory } from '@prisma/client';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: 'Maintenance',
  [ExpenseCategory.CONDOMINIUM]: 'Condominium',
  [ExpenseCategory.CLEANING]: 'Cleaning',
  [ExpenseCategory.REPAIRS]: 'Repairs',
  [ExpenseCategory.PAINTING]: 'Painting',
  [ExpenseCategory.FURNITURE]: 'Furniture',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.TAXES]: 'Taxes',
  [ExpenseCategory.INSURANCE]: 'Insurance',
  [ExpenseCategory.OTHER]: 'Other',
};

export const EXPENSE_CATEGORY_OPTIONS = Object.values(ExpenseCategory).map(
  (value) => ({ value, label: EXPENSE_CATEGORY_LABELS[value] }),
);
