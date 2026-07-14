import 'server-only';
import { format } from 'date-fns';
import { es as esDateLocale } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/shared/types/pagination';
import { NotFoundError } from '@/shared/lib/errors';
import { formatCurrency } from '@/shared/lib/format';
import { getStorage } from '@/shared/lib/storage';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { renderReceiptPdf } from '@/pdf/render';
import { clientEnv } from '@/shared/config/env';
import { defaultLocale, isLocale } from '@/i18n/config';

export type ReceiptListItem = Awaited<
  ReturnType<typeof receiptService.list>
>['items'][number];

/** Owner-scoped access for receipts (the write path lives in payments). */
export const receiptService = {
  async list(
    ownerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Awaited<ReturnType<typeof fetchReceipts>>[number]>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const [items, total] = await Promise.all([
      fetchReceipts(ownerId, skip, take),
      prisma.receipt.count({ where: { ownerId } }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  },

  async getById(ownerId: string, id: string) {
    const receipt = await prisma.receipt.findFirst({
      where: { id, ownerId },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
        payment: { select: { method: true, reference: true } },
      },
    });
    if (!receipt) throw new NotFoundError('Receipt');
    return receipt;
  },

  /**
   * Render the receipt PDF, upload it to storage and cache the URL. Idempotent
   * and safe to re-run: a receipt that already has a PDF is returned as-is.
   * Shared by the payment flow (post-commit) and the on-page backfill for
   * receipts whose generation never ran or failed.
   */
  async generatePdf(
    ownerId: string,
    receiptId: string,
  ): Promise<{ url: string; pdf?: Buffer } | null> {
    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, ownerId },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
        payment: { select: { method: true, reference: true } },
        owner: { select: { name: true, email: true } },
      },
    });
    if (!receipt) return null;
    if (receipt.pdfUrl) return { url: receipt.pdfUrl };

    const prefs = await getUserPreferences(ownerId);
    // Catalog locale ('en' | 'es'); prefs may hold a BCP-47 tag like "en-US".
    const locale = isLocale(prefs.locale.slice(0, 2))
      ? (prefs.locale.slice(0, 2) as typeof defaultLocale)
      : defaultLocale;
    // Latin-American number formatting ("US$1,200.00"), not Spain's.
    const numberLocale = locale === 'es' ? 'es-DO' : 'en-US';
    const [tMethod, tPdf] = await Promise.all([
      getTranslations({ locale, namespace: 'payments.methods' }),
      getTranslations({ locale, namespace: 'pdf.receipt' }),
    ]);
    const appName = clientEnv.NEXT_PUBLIC_APP_NAME;

    const pdf = await renderReceiptPdf({
      number: receipt.number,
      issuedAt: format(
        receipt.issuedAt,
        'PPP',
        locale === 'es' ? { locale: esDateLocale } : undefined,
      ),
      concept: receipt.concept,
      amount: formatCurrency(
        receipt.amount.toString(),
        receipt.currency,
        numberLocale,
      ),
      balanceAfter: formatCurrency(
        receipt.balanceAfter.toString(),
        receipt.currency,
        numberLocale,
      ),
      method: tMethod(receipt.payment.method),
      reference: receipt.payment.reference ?? undefined,
      ownerName: receipt.owner.name ?? receipt.owner.email ?? 'Owner',
      tenantName: `${receipt.tenant.firstName} ${receipt.tenant.lastName}`,
      propertyName: receipt.property.name,
      appName,
      labels: {
        paymentReceipt: tPdf('paymentReceipt'),
        receipt: tPdf('receipt'),
        paid: tPdf('paid'),
        receivedFrom: tPdf('receivedFrom'),
        receivedBy: tPdf('receivedBy'),
        concept: tPdf('concept'),
        amount: tPdf('amount'),
        totalPaid: tPdf('totalPaid'),
        method: tPdf('method'),
        balance: tPdf('balance'),
        reference: tPdf('reference'),
        footer: tPdf('footer', { app: appName }),
      },
    });

    const { url } = await getStorage().upload({
      key: `receipts/${ownerId}/${receipt.number}.pdf`,
      body: pdf,
      contentType: 'application/pdf',
      upsert: true,
    });

    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { pdfUrl: url },
    });

    return { url, pdf };
  },
};

function fetchReceipts(ownerId: string, skip: number, take: number) {
  return prisma.receipt.findMany({
    where: { ownerId },
    orderBy: { issuedAt: 'desc' },
    skip,
    take,
    select: {
      id: true,
      number: true,
      concept: true,
      amount: true,
      currency: true,
      issuedAt: true,
      pdfUrl: true,
      tenant: { select: { firstName: true, lastName: true } },
      property: { select: { name: true } },
    },
  });
}
