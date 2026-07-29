import type { Metadata } from 'next';
import { Suspense } from 'react';
import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
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
import { formatCurrency } from '@/shared/lib/format';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('receipts') };
}

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
  const t = await getTranslations('receipts');
  const formatDate = await getFormatDate();

  // Self-healing: seeded rows or failed post-payment renders leave pdfUrl
  // empty. Backfill them after the response so the next visit has the PDF.
  const missingPdf = items.filter((r) => !r.pdfUrl);
  if (missingPdf.length > 0) {
    after(async () => {
      for (const receipt of missingPdf) {
        try {
          await receiptService.generatePdf(ownerId, receipt.id);
        } catch (error) {
          console.error('[receipts] PDF backfill failed', receipt.id, error);
        }
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
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
              <TableHead>{t('colNumber')}</TableHead>
              <TableHead>{t('colDate')}</TableHead>
              <TableHead>{t('colTenant')}</TableHead>
              <TableHead>{t('colProperty')}</TableHead>
              <TableHead className="text-right">{t('colAmount')}</TableHead>
              <TableHead className="text-right">{t('colPdf')}</TableHead>
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
                      {t('generating')}
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
  const t = await getTranslations('receipts');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <Suspense
        key={currentPage}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <ReceiptsTable ownerId={ownerId} page={currentPage} />
      </Suspense>
    </div>
  );
}
