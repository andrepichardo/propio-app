'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/shared/lib/prisma';
import { createOwnerAction } from '@/shared/lib/action';
import { updateProfileSchema } from '../validators/settings.validators';

export const updateProfileAction = createOwnerAction(
  updateProfileSchema,
  async (input, { ownerId }) => {
    await prisma.user.update({
      where: { id: ownerId },
      data: {
        name: input.name,
        currency: input.currency,
        locale: input.locale,
        timezone: input.timezone,
      },
    });
    revalidatePath('/app', 'layout');
    return { ok: true };
  },
);
