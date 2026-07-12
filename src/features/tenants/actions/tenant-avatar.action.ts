'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { IMAGE_MIME_TYPES, readUploadedFile } from '@/shared/lib/uploads';
import { tenantService } from '../services/tenant.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadTenantAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ avatarUrl: string | null }>> {
  try {
    const ownerId = await requireOwnerId();

    const tenantId = z.string().cuid().safeParse(formData.get('tenantId'));
    if (!tenantId.success) {
      throw new ValidationError(
        (await getTranslations('tenants'))('avatarMissingRef'),
      );
    }

    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_AVATAR_BYTES,
      mimeTypes: IMAGE_MIME_TYPES,
    });

    const result = await tenantService.setAvatar(
      ownerId,
      tenantId.data,
      file,
    );

    revalidatePath(`/app/tenants/${tenantId.data}`);
    revalidatePath('/app/tenants');
    return ok(result);
  } catch (error) {
    return toActionFailure(error);
  }
}
