import 'server-only';
import type { ActivityAction } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';

type LogActivityInput = {
  ownerId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  /** Plain-English fallback shown for rows recorded before i18n existed. */
  summary: string;
  /**
   * Key inside the `activity` message namespace + its interpolation params.
   * Stored in `metadata` so the feed can render in the viewer's language.
   */
  messageKey?: string;
  params?: Record<string, string>;
  /** Reuse an open transaction so the log is atomic with its cause. */
  tx?: Prisma.TransactionClient;
};

/** Shape persisted in `Activity.metadata` for translatable entries. */
export type ActivityMessageMetadata = {
  key: string;
  params?: Record<string, string>;
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
        metadata: input.messageKey
          ? ({
              key: input.messageKey,
              params: input.params,
            } satisfies ActivityMessageMetadata)
          : undefined,
      },
    });
  } catch (error) {
    console.warn('[activity] failed to record activity', error);
  }
}
