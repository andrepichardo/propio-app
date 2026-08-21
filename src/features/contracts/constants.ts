import { ContractStatus } from '@/generated/prisma/enums';
import type { BadgeProps } from '@/shared/components/ui/badge';

/** Keys under `contracts.statuses` are the enum values; translate with
 * `t(\`statuses.${value}\`)`. */
export const CONTRACT_STATUS_VALUES = Object.values(ContractStatus);

export const CONTRACT_STATUS_VARIANT: Record<
  ContractStatus,
  BadgeProps['variant']
> = {
  [ContractStatus.ACTIVE]: 'success',
  [ContractStatus.EXPIRED]: 'secondary',
  [ContractStatus.CANCELLED]: 'destructive',
};
