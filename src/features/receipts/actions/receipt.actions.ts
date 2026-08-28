'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { receiptService } from '../services/receipt.service';
import { sendReceiptSchema } from '../validators/receipt.validators';

/**
 * Email an already-issued receipt to its tenant. Covers the case the payment
 * flow leaves open: the owner unticked "send receipt" at registration, or the
 * post-commit delivery failed.
 */
export const sendReceiptAction = createOwnerAction(
  sendReceiptSchema,
  async (input, { ownerId }) => {
    const result = await receiptService.emailToTenant(ownerId, input.id);
    // The send can also backfill a missing PDF, so the row's link changes.
    revalidatePath('/app/receipts');
    return result;
  },
);
