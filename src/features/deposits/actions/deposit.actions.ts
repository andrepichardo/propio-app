'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { depositService } from '../services/deposit.service';
import { settleDepositSchema } from '../validators/deposit.validators';

export const settleDepositAction = createOwnerAction(
  settleDepositSchema,
  async (input, { ownerId }) => {
    const result = await depositService.settle(ownerId, input);
    revalidatePath(`/app/contracts/${input.contractId}`);
    revalidatePath('/app/contracts');
    revalidatePath('/app');
    return result;
  },
);
