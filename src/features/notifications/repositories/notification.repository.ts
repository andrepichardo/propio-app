import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

/**
 * Data access for notifications. Every method is owner-scoped — the ownerId is
 * always part of the where clause, enforcing the tenant boundary at the lowest
 * layer so a service bug can never leak across owners.
 */
export const notificationRepository = {
  countUnread(ownerId: string): Promise<number> {
    return prisma.notification.count({
      where: { ownerId, readAt: null },
    });
  },

  list(
    ownerId: string,
    options?: { unreadOnly?: boolean; take?: number },
  ) {
    return prisma.notification.findMany({
      where: {
        ownerId,
        ...(options?.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.take ?? 50,
    });
  },

  markRead(ownerId: string, id: string) {
    return prisma.notification.updateMany({
      where: { ownerId, id },
      data: { readAt: new Date() },
    });
  },

  markAllRead(ownerId: string) {
    return prisma.notification.updateMany({
      where: { ownerId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  },
};
