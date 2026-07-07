import { ContractStatus } from '@prisma/client';
import type { BadgeProps } from '@/shared/components/ui/badge';

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.ACTIVE]: 'Active',
  [ContractStatus.EXPIRED]: 'Expired',
  [ContractStatus.CANCELLED]: 'Cancelled',
};

export const CONTRACT_STATUS_VARIANT: Record<
  ContractStatus,
  BadgeProps['variant']
> = {
  [ContractStatus.ACTIVE]: 'success',
  [ContractStatus.EXPIRED]: 'secondary',
  [ContractStatus.CANCELLED]: 'destructive',
};

export const CONTRACT_STATUS_OPTIONS = Object.values(ContractStatus).map(
  (value) => ({ value, label: CONTRACT_STATUS_LABELS[value] }),
);
