'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { expenseService } from '../services/expense.service';
import {
  createExpenseSchema,
  deleteExpenseSchema,
  updateExpenseSchema,
} from '../validators/expense.validators';

export const createExpenseAction = createOwnerAction(
  createExpenseSchema,
  async (input, { ownerId }) => {
    const expense = await expenseService.create(ownerId, input);
    revalidatePath('/app/expenses');
    revalidatePath('/app');
    return { id: expense.id };
  },
);

export const updateExpenseAction = createOwnerAction(
  updateExpenseSchema,
  async (input, { ownerId }) => {
    const expense = await expenseService.update(ownerId, input);
    revalidatePath('/app/expenses');
    return { id: expense.id };
  },
);

export const deleteExpenseAction = createOwnerAction(
  deleteExpenseSchema,
  async ({ id }, { ownerId }) => {
    const result = await expenseService.remove(ownerId, id);
    revalidatePath('/app/expenses');
    revalidatePath('/app');
    return result;
  },
);
