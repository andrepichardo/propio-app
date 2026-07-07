import { PropertyStatus, PropertyType } from '@prisma/client';
import type { BadgeProps } from '@/shared/components/ui/badge';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.TRADITIONAL_RENTAL]: 'Traditional rental',
  [PropertyType.VACATION_RENTAL]: 'Vacation rental',
  [PropertyType.PERSONAL]: 'Personal',
  [PropertyType.COMMERCIAL]: 'Commercial',
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.AVAILABLE]: 'Available',
  [PropertyStatus.OCCUPIED]: 'Occupied',
  [PropertyStatus.MAINTENANCE]: 'Maintenance',
};

export const PROPERTY_STATUS_VARIANT: Record<
  PropertyStatus,
  BadgeProps['variant']
> = {
  [PropertyStatus.AVAILABLE]: 'success',
  [PropertyStatus.OCCUPIED]: 'default',
  [PropertyStatus.MAINTENANCE]: 'warning',
};

export const PROPERTY_TYPE_OPTIONS = Object.values(PropertyType).map(
  (value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }),
);

export const PROPERTY_STATUS_OPTIONS = Object.values(PropertyStatus).map(
  (value) => ({ value, label: PROPERTY_STATUS_LABELS[value] }),
);
