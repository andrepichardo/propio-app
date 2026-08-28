import 'server-only';
import { format, getDaysInMonth } from 'date-fns';
import { es as esDateLocale } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/shared/types/pagination';
import { AppError, NotFoundError, ValidationError } from '@/shared/lib/errors';
import { formatCurrency } from '@/shared/lib/format';
import { getStorage } from '@/shared/lib/storage';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { renderReceiptPdf } from '@/pdf/render';
import { sendReceiptEmail } from '@/emails/send';
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
  ): Promise<
    PaginatedResult<Awaited<ReturnType<typeof fetchReceipts>>[number]>
  > {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const [items, total] = await Promise.all([
      fetchReceipts(ownerId, skip, take),
      prisma.receipt.count({ where: { ownerId, ...liveReceipt } }),
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
   * Email an existing receipt to its tenant, PDF attached.
   *
   * Covers what the payment flow leaves open: the owner unticked "send
   * receipt" when registering the payment, or the post-commit delivery failed.
   *
   * `generatePdf` hands back the rendered bytes only when it actually had to
   * build the file; for a receipt that already has one it returns just the
   * URL, so the bytes are pulled back from storage. If neither yields a PDF we
   * fail loudly rather than mail the tenant a receipt with nothing attached.
   */
  async emailToTenant(
    ownerId: string,
    receiptId: string,
  ): Promise<{ email: string }> {
    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, ownerId, ...liveReceipt },
      select: {
        id: true,
        number: true,
        amount: true,
        currency: true,
        tenant: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { name: true } },
      },
    });
    if (!receipt) throw new NotFoundError('Receipt');

    const email = receipt.tenant.email;
    if (!email) {
      throw new ValidationError('This tenant has no email address on file.');
    }

    const generated = await receiptService.generatePdf(ownerId, receipt.id);
    const pdf = generated?.pdf ?? (await downloadPdf(generated?.url));
    if (!pdf) {
      throw new AppError(
        'The receipt PDF could not be prepared. Please try again.',
        'RECEIPT_PDF_UNAVAILABLE',
        502,
      );
    }

    const [prefs, owner] = await Promise.all([
      getUserPreferences(ownerId),
      prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true },
      }),
    ]);
    // Catalog locale ('en' | 'es'); prefs may hold a BCP-47 tag like "en-US".
    const locale = prefs.locale.slice(0, 2);

    await sendReceiptEmail({
      to: email,
      tenantName: `${receipt.tenant.firstName} ${receipt.tenant.lastName}`,
      amount: formatCurrency(
        receipt.amount.toString(),
        receipt.currency,
        prefs.locale,
      ),
      receiptNumber: receipt.number,
      propertyName: receipt.property.name,
      ownerName: owner?.name,
      pdf,
      locale: isLocale(locale) ? locale : undefined,
    });

    return { email };
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
        property: { select: { name: true, addressLine: true, city: true } },
        payment: {
          select: {
            method: true,
            reference: true,
            notes: true,
            paidAt: true,
            periodStart: true,
          },
        },
        contract: { select: { dueDay: true, endDate: true, status: true } },
        owner: { select: { name: true, email: true, signatureUrl: true } },
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

    const method = tMethod(receipt.payment.method);
    const amount = formatCurrency(
      receipt.amount.toString(),
      receipt.currency,
      numberLocale,
    );

    const dateFnsOptions =
      locale === 'es' ? { locale: esDateLocale } : undefined;
    const formatLong = (date: Date) => format(date, 'PPP', dateFnsOptions);

    // "Payment received via bank transfer on July 3, 2026." + next-rent due
    // date (active contracts only) + manual notes.
    const nextDueDate = nextRentDueDate(
      receipt.payment.periodStart ?? receipt.payment.paidAt,
      receipt.contract,
    );
    const notes = [
      tPdf('autoNote', {
        method: method.toLowerCase(),
        date: formatLong(receipt.payment.paidAt),
      }),
      nextDueDate
        ? tPdf('autoNoteNextDue', { date: formatLong(nextDueDate) })
        : undefined,
      receipt.payment.reference
        ? `${tPdf('reference')}: ${receipt.payment.reference}`
        : undefined,
      receipt.payment.notes ?? undefined,
    ].filter((note): note is string => Boolean(note));

    const pdf = await renderReceiptPdf({
      number: receipt.number,
      dateShort: format(receipt.issuedAt, 'dd/MM/yyyy'),
      propertyName: receipt.property.name,
      propertyAddress:
        [receipt.property.addressLine, receipt.property.city]
          .filter(Boolean)
          .join(', ') || undefined,
      ownerName: receipt.owner.name ?? receipt.owner.email ?? 'Owner',
      tenantName: `${receipt.tenant.firstName} ${receipt.tenant.lastName}`,
      method,
      concept: receipt.concept,
      quantity: '1',
      unitAmount: amount,
      totalAmount: amount,
      notes,
      signatureUrl: receipt.owner.signatureUrl ?? undefined,
      appName,
      labels: {
        title: tPdf('title'),
        date: tPdf('date'),
        tenant: tPdf('tenant'),
        method: tPdf('method'),
        receiptNo: tPdf('receiptNo'),
        description: tPdf('description'),
        quantity: tPdf('quantity'),
        unitPrice: tPdf('unitPrice'),
        totalPrice: tPdf('totalPrice'),
        notes: tPdf('notes'),
        total: tPdf('total'),
        receivedBy: tPdf('receivedBy'),
      },
    });

    const { url } = await getStorage().upload({
      key: `receipts/${ownerId}/${receipt.number}.pdf`,
      body: pdf,
      contentType: 'application/pdf',
      upsert: true,
    });

    // `?v=` busts browser/CDN caches when a receipt is re-rendered onto the
    // same storage key (e.g. after a template change).
    const versionedUrl = `${url}?v=${Date.now()}`;
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { pdfUrl: versionedUrl },
    });

    return { url: versionedUrl, pdf };
  },
};

/**
 * Due date of the NEXT rent after the paid period: the contract's `dueDay`
 * in the following month (clamped to that month's length). Omitted when the
 * contract is no longer active or already ended by then. Dates are rebuilt
 * from UTC parts — date-only values live at UTC midnight in the DB.
 */
function nextRentDueDate(
  paidPeriod: Date,
  contract: { dueDay: number; endDate: Date | null; status: string },
): Date | null {
  if (contract.status !== 'ACTIVE') return null;

  const year = paidPeriod.getUTCFullYear();
  const nextMonth = paidPeriod.getUTCMonth() + 1;
  const day = Math.min(
    contract.dueDay,
    getDaysInMonth(new Date(year, nextMonth, 1)),
  );
  const nextDue = new Date(year, nextMonth, day);

  if (contract.endDate && nextDue > contract.endDate) return null;
  return nextDue;
}

/** Receipts whose payment is still live — a voided payment has no receipt. */
const liveReceipt = { payment: { deletedAt: null } };

/** Pull a stored receipt PDF back as bytes. The bucket is public, so a plain
 *  fetch is enough; a failure here is not fatal to the caller, which decides. */
async function downloadPdf(url?: string): Promise<Buffer | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('[receipts] could not download stored PDF', url, error);
    return undefined;
  }
}

function fetchReceipts(ownerId: string, skip: number, take: number) {
  return prisma.receipt.findMany({
    where: { ownerId, ...liveReceipt },
    // createdAt breaks ties so same-day receipts keep newest-first order.
    orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
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
      // `email` drives the send button's enabled state in the table.
      tenant: { select: { firstName: true, lastName: true, email: true } },
      property: { select: { name: true } },
    },
  });
}
