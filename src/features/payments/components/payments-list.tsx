import Link from 'next/link';
import { Download, Plus, Wallet } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import type { PaymentFilters } from '../validators/payment.validators';
import { PAYMENT_METHOD_LABELS } from '../constants';
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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No payments recorded yet"
        description="Register your first payment to generate a receipt and update your dashboard."
        action={
          <Button asChild>
            <Link href="/app/payments/new">
              <Plus className="size-4" /> Register payment
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
              <TableHead>Date</TableHead>
              <TableHead>Property / Tenant</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                    <p className="text-sm font-medium">
                      {payment.property.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.tenant.firstName} {payment.tenant.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.receipt?.pdfUrl ? (
                    <a
                      href={payment.receipt.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Download className="size-3.5" />
                      {payment.receipt.number}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {payment.receipt?.number ?? '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(payment.amount.toString(), payment.currency)}
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
