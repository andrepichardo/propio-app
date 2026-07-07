import { NotificationType } from '@prisma/client';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CircleDollarSign,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  [NotificationType.PAYMENT_UPCOMING]: CircleDollarSign,
  [NotificationType.PAYMENT_LATE]: AlertTriangle,
  [NotificationType.CONTRACT_EXPIRING]: CalendarClock,
  [NotificationType.MAINTENANCE_REMINDER]: Wrench,
  [NotificationType.SYSTEM]: Bell,
};
