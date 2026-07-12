'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCheck } from 'lucide-react';
import type { NotificationType } from '@prisma/client';
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
  title: string;
  body: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
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

      <ul className="divide-y rounded-xl border bg-card shadow-soft">
        {notifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type];
          const unread = !notification.readAt;
          return (
            <li
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                unread && 'bg-primary/[0.03]',
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
                  <p className="text-sm font-medium">{notification.title}</p>
                  {unread ? (
                    <span className="size-1.5 rounded-full bg-primary" />
                  ) : null}
                </div>
                {notification.body ? (
                  <p className="text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                ) : null}
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(notification.createdAt)}
                  </span>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t('view')}
                    </Link>
                  ) : null}
                  {unread ? (
                    <button
                      type="button"
                      onClick={() => markRead(notification.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
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
