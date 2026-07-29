'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/shared/lib/prisma';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { createOwnerAction } from '@/shared/lib/action';
import { getStorage } from '@/shared/lib/storage';
import { hashPassword, verifyPassword } from '@/shared/lib/auth/password';
import { IMAGE_MIME_TYPES, readUploadedFile } from '@/shared/lib/uploads';
import { AppError, ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import {
  changePasswordSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from '../validators/settings.validators';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

/** Stable per-user storage key: upserting replaces the previous avatar, so no
 * orphaned files accumulate. The `?v=` timestamp on the stored URL busts CDN
 * and browser caches after each change. */
function avatarKey(ownerId: string): string {
  return `avatars/${ownerId}`;
}

function signatureKey(ownerId: string): string {
  return `signatures/${ownerId}`;
}

export const updateProfileAction = createOwnerAction(
  updateProfileSchema,
  async (input, { ownerId }) => {
    await prisma.user.update({
      where: { id: ownerId },
      data: { name: input.name },
    });
    revalidatePath('/app', 'layout');
    return { ok: true };
  },
);

export const updatePreferencesAction = createOwnerAction(
  updatePreferencesSchema,
  async (input, { ownerId }) => {
    await prisma.user.update({
      where: { id: ownerId },
      data: {
        currency: input.currency,
        timezone: input.timezone,
      },
    });
    revalidatePath('/app', 'layout');
    return { ok: true };
  },
);

export const changePasswordAction = createOwnerAction(
  changePasswordSchema,
  async (input, { ownerId }) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { hashedPassword: true },
    });

    // OAuth-only accounts have no password to change.
    if (!user.hashedPassword) {
      const ts = await getTranslations('settings');
      throw new AppError(ts('noPasswordError'), 'NO_PASSWORD', 400);
    }

    // Always verify the current password — a stolen open session must not be
    // enough to take over the account.
    const valid = await verifyPassword(
      input.currentPassword,
      user.hashedPassword,
    );
    if (!valid) {
      const tv = await getTranslations('validation');
      throw new ValidationError(tv('incorrectCurrentPassword'), {
        currentPassword: ['incorrectCurrentPassword'],
      });
    }

    await prisma.user.update({
      where: { id: ownerId },
      data: { hashedPassword: await hashPassword(input.password) },
    });

    return { ok: true };
  },
);

export async function updateAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ownerId = await requireOwnerId();

    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_AVATAR_BYTES,
      mimeTypes: IMAGE_MIME_TYPES,
    });

    const { url } = await getStorage().upload({
      key: avatarKey(ownerId),
      body: file.bytes,
      contentType: file.type,
      upsert: true,
    });

    const versionedUrl = `${url}?v=${Date.now()}`;
    await prisma.user.update({
      where: { id: ownerId },
      data: { image: versionedUrl },
    });

    revalidatePath('/app', 'layout');
    return ok({ url: versionedUrl });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function removeAvatarAction(): Promise<
  ActionResult<{ ok: true }>
> {
  try {
    const ownerId = await requireOwnerId();

    await getStorage().remove(avatarKey(ownerId));
    await prisma.user.update({
      where: { id: ownerId },
      data: { image: null },
    });

    revalidatePath('/app', 'layout');
    return ok({ ok: true });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateSignatureAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ownerId = await requireOwnerId();

    const file = await readUploadedFile(formData.get('file'), {
      maxBytes: MAX_AVATAR_BYTES,
      mimeTypes: IMAGE_MIME_TYPES,
    });

    const { url } = await getStorage().upload({
      key: signatureKey(ownerId),
      body: file.bytes,
      contentType: file.type,
      upsert: true,
    });

    const versionedUrl = `${url}?v=${Date.now()}`;
    await prisma.user.update({
      where: { id: ownerId },
      data: { signatureUrl: versionedUrl },
    });

    revalidatePath('/app', 'layout');
    return ok({ url: versionedUrl });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function removeSignatureAction(): Promise<
  ActionResult<{ ok: true }>
> {
  try {
    const ownerId = await requireOwnerId();

    await getStorage().remove(signatureKey(ownerId));
    await prisma.user.update({
      where: { id: ownerId },
      data: { signatureUrl: null },
    });

    revalidatePath('/app', 'layout');
    return ok({ ok: true });
  } catch (error) {
    return toActionFailure(error);
  }
}
