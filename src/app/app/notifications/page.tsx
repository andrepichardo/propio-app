import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Bell } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { listNotifications } from '@/features/notifications/services/notification.service';
import { NotificationsPanel } from '@/features/notifications/components/notifications-panel';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('notifications') };
}

export default async function NotificationsPage() {
  const ownerId = await requireOwnerId();
  const notifications = await listNotifications(ownerId);
  const t = await getTranslations('notifications');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
        />
      ) : (
        <NotificationsPanel notifications={notifications} />
      )}
    </div>
  );
}
