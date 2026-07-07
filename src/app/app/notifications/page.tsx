import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { listNotifications } from '@/features/notifications/services/notification.service';
import { NotificationsPanel } from '@/features/notifications/components/notifications-panel';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const ownerId = await requireOwnerId();
  const notifications = await listNotifications(ownerId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Payment reminders, contract expirations and updates."
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You’re all caught up"
          description="Reminders about payments and contracts will appear here."
        />
      ) : (
        <NotificationsPanel notifications={notifications} />
      )}
    </div>
  );
}
