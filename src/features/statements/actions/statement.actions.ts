'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { statementService } from '../services/statement.service';
import {
  deleteStatementSchema,
  generateStatementSchema,
} from '../validators/statement.validators';

export const generateStatementAction = createOwnerAction(
  generateStatementSchema,
  async (input, { ownerId }) => {
    const result = await statementService.generate(ownerId, input);
    revalidatePath('/app/statements');
    return result;
  },
);

export const deleteStatementAction = createOwnerAction(
  deleteStatementSchema,
  async ({ id }, { ownerId }) => {
    const result = await statementService.remove(ownerId, id);
    revalidatePath('/app/statements');
    revalidatePath('/app');
    return result;
  },
);
