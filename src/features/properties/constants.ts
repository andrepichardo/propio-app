import { PropertyStatus, PropertyType } from '@prisma/client';
import type { BadgeProps } from '@/shared/components/ui/badge';

/**
 * Message keys under `properties.types` / `properties.statuses` are the enum
 * values themselves, so components translate with `t(\`types.${value}\`)`.
 */
export const PROPERTY_TYPE_VALUES = Object.values(PropertyType);
export const PROPERTY_STATUS_VALUES = Object.values(PropertyStatus);

/**
 * Gallery uploads. Kept here (not in the server-only uploads lib) so the
 * client can render the matching `accept` filter and size hint; the values
 * mirror IMAGE_MIME_TYPES / MAX_PHOTO_BYTES enforced in the action.
 */
export const PROPERTY_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_PROPERTY_PHOTO_MB = 5;

export const PROPERTY_STATUS_VARIANT: Record<
  PropertyStatus,
  BadgeProps['variant']
> = {
  [PropertyStatus.AVAILABLE]: 'success',
  [PropertyStatus.OCCUPIED]: 'default',
  [PropertyStatus.MAINTENANCE]: 'warning',
};
