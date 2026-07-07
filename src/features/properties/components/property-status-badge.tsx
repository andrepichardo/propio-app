import type { PropertyStatus } from '@prisma/client';
import { Badge } from '@/shared/components/ui/badge';
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_VARIANT,
} from '../constants';

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <Badge variant={PROPERTY_STATUS_VARIANT[status]}>
      {PROPERTY_STATUS_LABELS[status]}
    </Badge>
  );
}
