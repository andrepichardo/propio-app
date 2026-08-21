import { useTranslations } from 'next-intl';
import type { PropertyStatus } from '@/generated/prisma/enums';
import { Badge } from '@/shared/components/ui/badge';
import { PROPERTY_STATUS_VARIANT } from '../constants';

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const t = useTranslations('properties.statuses');
  return <Badge variant={PROPERTY_STATUS_VARIANT[status]}>{t(status)}</Badge>;
}
