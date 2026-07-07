'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { contractService } from '../services/contract.service';
import {
  createContractSchema,
  deleteContractSchema,
  updateContractSchema,
} from '../validators/contract.validators';

export const createContractAction = createOwnerAction(
  createContractSchema,
  async (input, { ownerId }) => {
    const contract = await contractService.create(ownerId, input);
    revalidatePath('/app/contracts');
    revalidatePath('/app');
    return { id: contract.id };
  },
);

export const updateContractAction = createOwnerAction(
  updateContractSchema,
  async (input, { ownerId }) => {
    const contract = await contractService.update(ownerId, input);
    revalidatePath('/app/contracts');
    revalidatePath(`/app/contracts/${contract.id}`);
    return { id: contract.id };
  },
);

export const deleteContractAction = createOwnerAction(
  deleteContractSchema,
  async ({ id }, { ownerId }) => {
    const result = await contractService.remove(ownerId, id);
    revalidatePath('/app/contracts');
    return result;
  },
);
