import 'server-only';
import type { ActivityAction, Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

type LogActivityInput = {
  ownerId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  /** Reuse an open transaction so the log is atomic with its cause. */
  tx?: Prisma.TransactionClient;
};

/**
 * Append an entry to the owner's audit trail (powers "Recent Activity").
 * Logging must never break the primary operation, so failures are swallowed
 * with a warning rather than thrown.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  const client = input.tx ?? prisma;
  try {
    await client.activity.create({
      data: {
        ownerId: input.ownerId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.warn('[activity] failed to record activity', error);
  }
}
