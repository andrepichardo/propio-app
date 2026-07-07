import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Download, Receipt } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { receiptService } from '@/features/receipts/services/receipt.service';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { PaginationControls } from '@/shared/components/pagination-controls';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatCurrency, formatDate } from '@/shared/lib/format';

export const metadata: Metadata = { title: 'Receipts' };

async function ReceiptsTable({
  ownerId,
  page,
}: {
  ownerId: string;
  page: number;
}) {
  const { items, pageCount, total } = await receiptService.list(ownerId, {
    page,
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No receipts yet"
        description="Receipts are generated automatically when you register a payment."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.number}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(receipt.issuedAt)}
                </TableCell>
                <TableCell className="text-sm">
                  {receipt.tenant.firstName} {receipt.tenant.lastName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {receipt.property.name}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(receipt.amount.toString(), receipt.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {receipt.pdfUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={receipt.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Generating…
                    </span>
                  )}
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

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        description="Every receipt generated from your payments."
      />
      <Suspense
        key={currentPage}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <ReceiptsTable ownerId={ownerId} page={currentPage} />
      </Suspense>
    </div>
  );
}
