'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCheck } from 'lucide-react';
import type { NotificationType } from '@/generated/prisma/enums';
import { NOTIFICATION_ICONS } from '../constants';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '../actions/notification.actions';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { formatRelative } from '@/shared/lib/format';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  /** English fallback used for legacy rows without a translatable key. */
  title: string;
  body: string | null;
  /** `{ key, params }` for locale-aware rendering; Prisma JsonValue. */
  metadata: unknown;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type NotificationMeta = {
  key?: string;
  params?: Record<string, string | number>;
};

export function NotificationsPanel({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const hasUnread = notifications.some((n) => !n.readAt);

  // Prefer the translated key+params; fall back to the stored English text for
  // legacy rows recorded before notifications carried a message key.
  function resolveText(notification: NotificationItem) {
    const meta = notification.metadata as NotificationMeta | null;
    if (meta?.key && t.has(`${meta.key}.title`)) {
      return {
        title: t(`${meta.key}.title`, meta.params),
        body: t(`${meta.key}.body`, meta.params),
      };
    }
    return { title: notification.title, body: notification.body };
  }

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction({ id });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasUnread || isPending}
          onClick={markAllRead}
        >
          <CheckCheck className="size-4" /> {t('markAllRead')}
        </Button>
      </div>

      <ul className="bg-card shadow-soft divide-y rounded-xl border">
        {notifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type];
          const unread = !notification.readAt;
          const { title, body } = resolveText(notification);
          return (
            <li
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                unread && 'bg-primary/3',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                  unread
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{title}</p>
                  {unread ? (
                    <span className="bg-primary size-1.5 rounded-full" />
                  ) : null}
                </div>
                {body ? (
                  <p className="text-muted-foreground text-sm">{body}</p>
                ) : null}
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {formatRelative(notification.createdAt)}
                  </span>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {t('view')}
                    </Link>
                  ) : null}
                  {unread ? (
                    <button
                      type="button"
                      onClick={() => markRead(notification.id)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {t('markRead')}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
