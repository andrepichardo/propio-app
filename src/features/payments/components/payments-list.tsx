import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Download, Paperclip, Plus, Wallet } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { PaymentFilters } from '../validators/payment.validators';
import { EditPaymentDialog } from './edit-payment-dialog';
import { DeletePaymentDialog } from './delete-payment-dialog';
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
import { formatCurrency } from '@/shared/lib/format';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function PaymentsList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: PaymentFilters;
}) {
  const { items, page, pageCount, total } = await paymentService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('payments');
  const formatDate = await getFormatDate();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={t('emptyTitle')}
        description={t('emptyDesc')}
        action={
          <Button asChild>
            <Link href="/app/payments/new">
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
              <TableHead>{t('colDate')}</TableHead>
              <TableHead>{t('colPropertyTenant')}</TableHead>
              <TableHead>{t('colMethod')}</TableHead>
              <TableHead>{t('colReceipt')}</TableHead>
              <TableHead>{t('colProof')}</TableHead>
              <TableHead className="text-right">{t('colAmount')}</TableHead>
              <TableHead className="w-[88px]">
                <span className="sr-only">{t('colActions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(payment.paidAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {payment.property.name}
                      {payment.type === 'DEPOSIT' && (
                        <Badge variant="outline">{t('depositBadge')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payment.tenant.firstName} {payment.tenant.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t(`methods.${payment.method}`)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {payment.receipt?.pdfUrl ? (
                    <a
                      href={payment.receipt.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Download className="size-3.5 shrink-0" />
                      {payment.receipt.number}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {payment.receipt?.number ?? '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {payment.proofUrl ? (
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Paperclip className="size-3.5" />
                      {t('viewProof')}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(payment.amount.toString(), payment.currency)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <EditPaymentDialog
                      payment={{
                        id: payment.id,
                        amount: Number(payment.amount),
                        type: payment.type,
                        method: payment.method,
                        reference: payment.reference,
                        concept: payment.concept,
                        notes: payment.notes,
                        proofUrl: payment.proofUrl,
                        paidAt: payment.paidAt.toISOString(),
                        periodStart: payment.periodStart?.toISOString() ?? null,
                        settlesPeriod: payment.settlesPeriod,
                        rent: Number(payment.contract.monthlyRent),
                        dueDay: payment.contract.dueDay,
                      }}
                    />
                    <DeletePaymentDialog paymentId={payment.id} />
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
