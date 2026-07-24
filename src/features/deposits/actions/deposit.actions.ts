'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { depositService } from '../services/deposit.service';
import {
  settleDepositSchema,
  voidSettlementSchema,
} from '../validators/deposit.validators';

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

export const voidSettlementAction = createOwnerAction(
  voidSettlementSchema,
  async ({ id, contractId }, { ownerId }) => {
    const result = await depositService.voidSettlement(ownerId, id);
    revalidatePath(`/app/contracts/${contractId}`);
    revalidatePath('/app/contracts');
    // Revenue and "deposits held" both shift back.
    revalidatePath('/app');
    revalidatePath('/app/reports');
    return result;
  },
);
