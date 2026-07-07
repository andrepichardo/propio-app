'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { PDF_MIME_TYPES, readUploadedFile } from '@/shared/lib/uploads';
import { contractService } from '../services/contract.service';

const MAX_CONTRACT_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadContractPdfAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ownerId = await requireOwnerId();

    const contractId = z
      .string()
      .cuid()
      .safeParse(formData.get('contractId'));
    if (!contractId.success) {
      throw new ValidationError('Missing contract reference.');
    }

    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_CONTRACT_PDF_BYTES,
      mimeTypes: PDF_MIME_TYPES,
    });

    const result = await contractService.setContractPdf(
      ownerId,
      contractId.data,
      file,
    );

    revalidatePath(`/app/contracts/${contractId.data}`);
    return ok(result);
  } catch (error) {
    return toActionFailure(error);
  }
}
