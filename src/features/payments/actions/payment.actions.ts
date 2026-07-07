'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { paymentService } from '../services/payment.service';
import {
  deletePaymentSchema,
  registerPaymentSchema,
} from '../validators/payment.validators';

export const registerPaymentAction = createOwnerAction(
  registerPaymentSchema,
  async (input, { ownerId }) => {
    const result = await paymentService.register(ownerId, input);
    revalidatePath('/app/payments');
    revalidatePath('/app/receipts');
    revalidatePath('/app');
    return result;
  },
);

export const deletePaymentAction = createOwnerAction(
  deletePaymentSchema,
  async ({ id }, { ownerId }) => {
    const result = await paymentService.remove(ownerId, id);
    revalidatePath('/app/payments');
    revalidatePath('/app');
    return result;
  },
);
