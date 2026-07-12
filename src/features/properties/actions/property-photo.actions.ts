'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { createOwnerAction } from '@/shared/lib/action';
import { ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { IMAGE_MIME_TYPES, readUploadedFile } from '@/shared/lib/uploads';
import { propertyService } from '../services/property.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadPropertyPhotoAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ownerId = await requireOwnerId();

    const propertyId = z
      .string()
      .cuid()
      .safeParse(formData.get('propertyId'));
    if (!propertyId.success) {
      const t = await getTranslations('properties.photos');
      throw new ValidationError(t('missingRef'));
    }

    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_PHOTO_BYTES,
      mimeTypes: IMAGE_MIME_TYPES,
    });

    const photo = await propertyService.addPhoto(
      ownerId,
      propertyId.data,
      file,
    );

    revalidatePath(`/app/properties/${propertyId.data}`);
    revalidatePath('/app/properties');
    return ok({ id: photo.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export const deletePropertyPhotoAction = createOwnerAction(
  z.object({ id: z.string().cuid(), propertyId: z.string().cuid() }),
  async ({ id, propertyId }, { ownerId }) => {
    const result = await propertyService.removePhoto(ownerId, id);
    revalidatePath(`/app/properties/${propertyId}`);
    revalidatePath('/app/properties');
    return result;
  },
);
