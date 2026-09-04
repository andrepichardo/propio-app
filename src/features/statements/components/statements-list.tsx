import { getTranslations } from 'next-intl/server';
import { Download, ScrollText } from 'lucide-react';
import { statementService } from '../services/statement.service';
import type { StatementFilters } from '../validators/statement.validators';
import { DeleteStatementDialog } from './delete-statement-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
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

export async function StatementsList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: StatementFilters;
}) {
  const { items, page, pageCount, total } = await statementService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('statements');

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title={t('emptyTitle')}
        description={t('emptyDesc')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card shadow-soft rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('colNumber')}</TableHead>
              <TableHead>{t('colPeriod')}</TableHead>
              <TableHead>{t('colPropertyTenant')}</TableHead>
              <TableHead className="text-right">{t('colPaid')}</TableHead>
              <TableHead className="text-right">
                {t('colOutstanding')}
              </TableHead>
              <TableHead className="text-right">{t('colPdf')}</TableHead>
              <TableHead className="w-[52px]">
                <span className="sr-only">{t('colActions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((statement) => {
              const outstanding = Number(statement.outstanding);
              return (
                <TableRow key={statement.id}>
                  <TableCell className="font-medium">
                    {statement.number}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(statement.periodStart, 'MMMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {statement.property.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {statement.tenant.firstName} {statement.tenant.lastName}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      statement.totalPaid.toString(),
                      statement.currency,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={outstanding > 0 ? 'warning' : 'success'}>
                      {formatCurrency(outstanding, statement.currency)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {statement.pdfUrl ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={statement.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="size-4" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('generating')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteStatementDialog statementId={statement.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} pageCount={pageCount} total={total} />
    </div>
  );
}
