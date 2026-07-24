import { FurnishingType, PropertyStatus, PropertyType } from '@prisma/client';
import type { BadgeProps } from '@/shared/components/ui/badge';

/**
 * Message keys under `properties.types` / `properties.statuses` are the enum
 * values themselves, so components translate with `t(\`types.${value}\`)`.
 */
export const PROPERTY_TYPE_VALUES = Object.values(PropertyType);
export const PROPERTY_STATUS_VALUES = Object.values(PropertyStatus);
/** Keys under `properties.furnishing`; render with `t(\`furnishing.${value}\`)`. */
export const FURNISHING_VALUES = Object.values(FurnishingType);

/**
 * Boolean amenities, rendered as a checklist in the form and as badges on the
 * detail page. Adding one here wires it into both — the field must exist on
 * the Property model and in the validator.
 */
export const PROPERTY_AMENITIES = [
  'petsAllowed',
  'hasPowerBackup',
  'hasWaterTank',
  'hasAirConditioning',
] as const;

export type PropertyAmenity = (typeof PROPERTY_AMENITIES)[number];

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
