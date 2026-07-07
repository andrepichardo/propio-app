import 'server-only';
import { notificationRepository } from '../repositories/notification.repository';

/**
 * Notification business logic. Thin today, but the seam is here for future
 * fan-out (email/WhatsApp) and de-duplication rules.
 */
export function getUnreadNotificationCount(ownerId: string): Promise<number> {
  return notificationRepository.countUnread(ownerId);
}

export function listNotifications(
  ownerId: string,
  options?: { unreadOnly?: boolean },
) {
  return notificationRepository.list(ownerId, options);
}

export async function markNotificationRead(
  ownerId: string,
  id: string,
): Promise<void> {
  await notificationRepository.markRead(ownerId, id);
}

export async function markAllNotificationsRead(
  ownerId: string,
): Promise<void> {
  await notificationRepository.markAllRead(ownerId);
}
