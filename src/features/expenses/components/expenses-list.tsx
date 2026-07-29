import { getTranslations } from 'next-intl/server';
import { Banknote, FileText } from 'lucide-react';
import { expenseService } from '../services/expense.service';
import type { ExpenseFilters } from '../validators/expense.validators';
import { DeleteExpenseButton } from './delete-expense-button';
import { EditExpenseDialog } from './edit-expense-dialog';
import type { OptionItem } from '@/features/contracts/components/contract-form';
import { EmptyState } from '@/shared/components/empty-state';
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
import { formatCurrency } from '@/shared/lib/format';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function ExpensesList({
  ownerId,
  filters,
  properties,
}: {
  ownerId: string;
  filters: ExpenseFilters;
  properties: OptionItem[];
}) {
  const { items, page, pageCount, total } = await expenseService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('expenses');
  const formatDate = await getFormatDate();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title={t('emptyTitle')}
        description={t('emptyDesc')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('colDate')}</TableHead>
              <TableHead>{t('colDescription')}</TableHead>
              <TableHead>{t('colCategory')}</TableHead>
              <TableHead>{t('colProperty')}</TableHead>
              <TableHead className="text-right">{t('colAmount')}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(expense.incurredAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{expense.description}</span>
                    {expense.invoiceUrl ? (
                      <a
                        href={expense.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('viewInvoice')}
                        title={t('viewInvoice')}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <FileText className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {expense.vendor ? (
                    <p className="text-xs text-muted-foreground">
                      {expense.vendor}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t(`categories.${expense.category}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {expense.property?.name ?? t('portfolioWide')}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(expense.amount.toString(), expense.currency)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <EditExpenseDialog
                      properties={properties}
                      expense={{
                        id: expense.id,
                        description: expense.description,
                        category: expense.category,
                        amount: Number(expense.amount),
                        currency: expense.currency,
                        incurredAt: expense.incurredAt.toISOString(),
                        vendor: expense.vendor,
                        propertyId: expense.property?.id ?? null,
                      }}
                    />
                    <DeleteExpenseButton expenseId={expense.id} />
                  </div>
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
