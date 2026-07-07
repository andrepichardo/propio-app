'use server';

import { revalidatePath } from 'next/cache';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { createOwnerAction } from '@/shared/lib/action';
import { ValidationError } from '@/shared/lib/errors';
import {
  type ActionResult,
  ok,
  toActionFailure,
} from '@/shared/lib/result';
import { documentService } from '../services/document.service';
import {
  deleteDocumentSchema,
  uploadDocumentSchema,
} from '../validators/document.validators';

/**
 * Upload takes FormData (files can't cross the wire as JSON), so it's written
 * out explicitly rather than via `createOwnerAction`.
 */
export async function uploadDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ownerId = await requireOwnerId();

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new ValidationError('Choose a file to upload.', {
        file: ['Choose a file to upload.'],
      });
    }

    const parsed = uploadDocumentSchema.safeParse({
      name: formData.get('name') || file.name,
      type: formData.get('type') || undefined,
      propertyId: formData.get('propertyId') || undefined,
      tenantId: formData.get('tenantId') || undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        'Please correct the highlighted fields.',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const document = await documentService.upload(ownerId, parsed.data, {
      name: file.name,
      type: file.type,
      size: file.size,
      bytes: await file.arrayBuffer(),
    });

    revalidatePath('/app/documents');
    return ok({ id: document.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export const deleteDocumentAction = createOwnerAction(
  deleteDocumentSchema,
  async ({ id }, { ownerId }) => {
    const result = await documentService.remove(ownerId, id);
    revalidatePath('/app/documents');
    return result;
  },
);
