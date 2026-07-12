import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileSignature, Plus } from 'lucide-react';
import { contractService } from '../services/contract.service';
import type { ContractFilters } from '../validators/contract.validators';
import { CONTRACT_STATUS_VARIANT } from '../constants';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { PaginationControls } from '@/shared/components/pagination-controls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatCurrency, formatDate } from '@/shared/lib/format';

export async function ContractsList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: ContractFilters;
}) {
  const { items, page, pageCount, total } = await contractService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('contracts');

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title={filters.status ? t('emptyFilteredTitle') : t('emptyTitle')}
        description={t('emptyDesc')}
        action={
          <Button asChild>
            <Link href="/app/contracts/new">
              <Plus className="size-4" /> {t('add')}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('colProperty')}</TableHead>
              <TableHead>{t('colTenant')}</TableHead>
              <TableHead>{t('colPeriod')}</TableHead>
              <TableHead className="text-right">{t('colRent')}</TableHead>
              <TableHead className="text-right">{t('colStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((contract) => (
              <TableRow key={contract.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/app/contracts/${contract.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {contract.property.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {contract.tenant.firstName} {contract.tenant.lastName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(contract.startDate, 'MMM d, yyyy')}
                  {' – '}
                  {contract.endDate
                    ? formatDate(contract.endDate, 'MMM d, yyyy')
                    : t('open')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(
                    contract.monthlyRent.toString(),
                    contract.currency,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
                    {t(`statuses.${contract.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} pageCount={pageCount} total={total} />
    </div>
  );
}
