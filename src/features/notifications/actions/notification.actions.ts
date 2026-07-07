'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction, createOwnerQueryAction } from '@/shared/lib/action';
import { z } from 'zod';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service';

export const markNotificationReadAction = createOwnerAction(
  z.object({ id: z.string().cuid() }),
  async ({ id }, { ownerId }) => {
    await markNotificationRead(ownerId, id);
    revalidatePath('/app/notifications');
    return { id };
  },
);

export const markAllNotificationsReadAction = createOwnerQueryAction(
  async ({ ownerId }) => {
    await markAllNotificationsRead(ownerId);
    revalidatePath('/app/notifications');
    return { ok: true };
  },
);
