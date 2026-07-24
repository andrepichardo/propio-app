'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { requireOwnerId } from '@/shared/lib/auth/session';
import {
  IMAGE_MIME_TYPES,
  PDF_MIME_TYPES,
  readUploadedFile,
} from '@/shared/lib/uploads';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { paymentService } from '../services/payment.service';
import { MAX_PAYMENT_PROOF_MB } from '../constants';
import {
  deletePaymentSchema,
  registerPaymentSchema,
  updatePaymentSchema,
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

/**
 * Files can't cross the wire as JSON, so the proof upload is its own FormData
 * action: the form calls it on file pick and sends back only the stored URL
 * with the registration payload.
 */
export async function uploadPaymentProofAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ownerId = await requireOwnerId();
    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_PAYMENT_PROOF_MB * 1024 * 1024,
      mimeTypes: [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES],
    });
    return ok(await paymentService.uploadProof(ownerId, file));
  } catch (error) {
    return toActionFailure(error);
  }
}

export const updatePaymentAction = createOwnerAction(
  updatePaymentSchema,
  async (input, { ownerId }) => {
    const result = await paymentService.update(ownerId, input);
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
    revalidatePath('/app/receipts');
    revalidatePath('/app');
    return result;
  },
);
