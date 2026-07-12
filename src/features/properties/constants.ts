import { PropertyStatus, PropertyType } from '@prisma/client';
import type { BadgeProps } from '@/shared/components/ui/badge';

/**
 * Message keys under `properties.types` / `properties.statuses` are the enum
 * values themselves, so components translate with `t(\`types.${value}\`)`.
 */
export const PROPERTY_TYPE_VALUES = Object.values(PropertyType);
export const PROPERTY_STATUS_VALUES = Object.values(PropertyStatus);

export const PROPERTY_STATUS_VARIANT: Record<
  PropertyStatus,
  BadgeProps['variant']
> = {
  [PropertyStatus.AVAILABLE]: 'success',
  [PropertyStatus.OCCUPIED]: 'default',
  [PropertyStatus.MAINTENANCE]: 'warning',
};
