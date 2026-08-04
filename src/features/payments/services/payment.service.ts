import 'server-only';
import { randomUUID } from 'crypto';
import {
  ActivityAction,
  NotificationType,
  PaymentType,
  type Prisma,
} from '@prisma/client';
import { addMonths, format } from 'date-fns';
import { es as esDateLocale } from 'date-fns/locale';
import { prisma } from '@/shared/lib/prisma';
import { getStorage } from '@/shared/lib/storage';
import { fileExtension, type UploadedFile } from '@/shared/lib/uploads';
import { paymentRepository } from '../repositories/payment.repository';
import type {
  PaymentFilters,
  RegisterPaymentInput,
  UpdatePaymentInput,
} from '../validators/payment.validators';
import { ForbiddenError, NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency } from '@/shared/lib/format';
import { receiptService } from '@/features/receipts/services/receipt.service';
import { sendReceiptEmail } from '@/emails/send';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { isLocale } from '@/i18n/config';

/**
 * Generate the next per-owner receipt number for the current year, e.g.
 * `REC-2026-0007`. Runs inside the payment transaction so it can't race with a
 * concurrent registration.
 *
 * Derived from the HIGHEST existing number, not a row count: payments can be
 * permanently deleted, and a count would reuse a live number after a gap and
 * collide with `@@unique([ownerId, number])`. Zero-padding to 4 digits keeps
 * the lexical `desc` order numeric for realistic per-year volumes.
 */
/**
 * Recover a storage key from a Supabase public URL. The proof key uses a random
 * UUID and only the URL is persisted, so deleting the blob means parsing it out
 * of `.../object/public/{bucket}/{key}`. Returns null for anything unexpected.
 */
function storageKeyFromPublicUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = '/object/public/';
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const afterBucket = url.slice(at + marker.length).split('?')[0] ?? '';
  const slash = afterBucket.indexOf('/');
  if (slash === -1) return null;
  return decodeURIComponent(afterBucket.slice(slash + 1));
}

/**
 * Localized default concept, used when the owner leaves the field blank. Rent
 * shows the period it covers as a date range ("Alquiler 15 de julio – 15 de
 * agosto" / "Rent July 15 – August 15"); a deposit is just labelled. Stored
 * verbatim, so it's built in the owner's language at creation — not
 * re-translated at render.
 */
/**
 * Rent period a payment covers, anchored to the contract's **due day** — never
 * the date it happened to be paid. It runs from `dueDay` of the paidAt month to
 * the same day next month (e.g. due day 15, paid Aug 4 → 15 Aug – 15 Sep; the
 * same for a payment made Aug 20). Built at UTC midnight like other date-only
 * values, so `nextRentDueDate` and month bucketing stay consistent.
 */
function rentPeriodStart(paidAt: Date, dueDay: number): Date {
  const year = paidAt.getUTCFullYear();
  const month = paidAt.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(dueDay, 1), daysInMonth);
  return new Date(Date.UTC(year, month, day));
}

function defaultConcept(
  baseDate: Date,
  isDeposit: boolean,
  locale: string,
): string {
  const isEs = locale.startsWith('es');
  if (isDeposit) return isEs ? 'Depósito de garantía' : 'Security deposit';

  const pattern = isEs ? "d 'de' MMMM" : 'MMMM d';
  const opts = isEs ? { locale: esDateLocale } : undefined;
  const start = format(baseDate, pattern, opts);
  const end = format(addMonths(baseDate, 1), pattern, opts);
  return `${isEs ? 'Alquiler' : 'Rent'} ${start} – ${end}`;
}

async function nextReceiptNumber(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;
  const latest = await tx.receipt.findFirst({
    where: { ownerId, number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  const nextSeq = latest ? Number(latest.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export const paymentService = {
  list(ownerId: string, filters: PaymentFilters) {
    return paymentRepository.list(ownerId, filters);
  },

  async getById(ownerId: string, id: string) {
    const payment = await paymentRepository.findById(ownerId, id);
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  },

  /**
   * Core money flow. Atomically records the payment, issues a receipt, marks
   * rent as paid and writes the audit trail. PDF rendering + email happen
   * after commit so a slow render never rolls back the payment.
   */
  async register(ownerId: string, input: RegisterPaymentInput) {
    const contract = await prisma.contract.findFirst({
      where: { id: input.contractId, ownerId, deletedAt: null },
      include: {
        property: { select: { id: true, name: true } },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!contract) {
      throw new ForbiddenError('Contract not found in your account.');
    }

    const isDeposit = input.type === PaymentType.DEPOSIT;
    const monthlyRent = Number(contract.monthlyRent);
    // A deposit doesn't settle rent, so it never leaves a rent balance.
    const balanceAfter = isDeposit
      ? 0
      : Math.max(0, monthlyRent - input.amount);
    const prefs = await getUserPreferences(ownerId);
    // Rent covers a due-day-to-due-day period, regardless of when it was paid.
    const rentPeriod = isDeposit
      ? undefined
      : (input.periodStart ?? rentPeriodStart(input.paidAt, contract.dueDay));
    const concept =
      input.concept ??
      defaultConcept(rentPeriod ?? input.paidAt, isDeposit, prefs.locale);

    // --- Atomic write: payment + receipt + activity -------------------------
    const { payment, receipt } = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          ownerId,
          contractId: contract.id,
          propertyId: contract.propertyId,
          tenantId: contract.tenantId,
          amount: input.amount,
          currency: contract.currency,
          method: input.method,
          type: input.type,
          status: 'COMPLETED',
          reference: input.reference,
          concept,
          proofUrl: input.proofUrl || undefined,
          // A deposit settles no rent period.
          periodStart: rentPeriod,
          paidAt: input.paidAt,
          notes: input.notes,
        },
      });

      const number = await nextReceiptNumber(tx, ownerId);
      const receipt = await tx.receipt.create({
        data: {
          ownerId,
          paymentId: payment.id,
          contractId: contract.id,
          propertyId: contract.propertyId,
          tenantId: contract.tenantId,
          number,
          concept,
          amount: input.amount,
          currency: contract.currency,
          balanceAfter,
          issuedAt: input.paidAt,
        },
      });

      await logActivity({
        tx,
        ownerId,
        action: ActivityAction.PAYMENT_REGISTERED,
        entityType: 'Payment',
        entityId: payment.id,
        summary: `Registered ${formatCurrency(input.amount, contract.currency)} from ${contract.tenant.firstName} ${contract.tenant.lastName}`,
        messageKey: 'paymentRegistered',
        params: {
          amount: formatCurrency(input.amount, contract.currency),
          tenant: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
        },
      });

      return { payment, receipt };
    });

    // --- Post-commit side effects (best-effort) -----------------------------
    void this.finalizeReceipt({
      ownerId,
      receiptId: receipt.id,
      number: receipt.number,
      amount: input.amount,
      currency: contract.currency,
      tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      tenantEmail: contract.tenant.email,
      propertyName: contract.property.name,
      sendReceipt: input.sendReceipt,
    });

    if (!isDeposit && balanceAfter > 0) {
      await prisma.notification.create({
        data: {
          ownerId,
          type: NotificationType.PAYMENT_UPCOMING,
          title: 'Partial payment recorded',
          body: `${contract.tenant.firstName} still owes ${formatCurrency(balanceAfter, contract.currency)} on ${contract.property.name}.`,
          metadata: {
            key: 'paymentPartial',
            params: {
              tenant: contract.tenant.firstName,
              amount: formatCurrency(balanceAfter, contract.currency),
              property: contract.property.name,
            },
          },
          entityType: 'Contract',
          entityId: contract.id,
          actionUrl: `/app/contracts/${contract.id}`,
        },
      });
    }

    return { id: payment.id, receiptNumber: receipt.number };
  },

  /**
   * Render + store the receipt PDF (via receiptService.generatePdf) and email
   * it to the tenant when requested. Isolated so failures here never surface
   * to the payment registration path.
   */
  async finalizeReceipt(params: {
    ownerId: string;
    receiptId: string;
    number: string;
    amount: number;
    currency: string;
    tenantName: string;
    tenantEmail?: string | null;
    propertyName: string;
    sendReceipt: boolean;
  }): Promise<void> {
    try {
      const result = await receiptService.generatePdf(
        params.ownerId,
        params.receiptId,
      );

      if (params.sendReceipt && params.tenantEmail) {
        const [prefs, owner] = await Promise.all([
          getUserPreferences(params.ownerId),
          prisma.user.findUnique({
            where: { id: params.ownerId },
            select: { name: true },
          }),
        ]);
        // Runs post-commit (outside the request scope), so the owner's locale
        // has to travel explicitly — the cookie fallback doesn't apply here.
        const locale = prefs.locale.slice(0, 2);
        await sendReceiptEmail({
          to: params.tenantEmail,
          tenantName: params.tenantName,
          amount: formatCurrency(params.amount, params.currency, prefs.locale),
          receiptNumber: params.number,
          propertyName: params.propertyName,
          ownerName: owner?.name,
          pdf: result?.pdf,
          locale: isLocale(locale) ? locale : undefined,
        });
      }
    } catch (error) {
      console.error('[payments] finalizeReceipt failed', error);
    }
  },

  /**
   * Store an uploaded proof of payment and hand back its public URL. The URL
   * travels with the registration payload, so the blob lands in storage before
   * the payment row exists — a form the user abandons leaves an orphan blob,
   * the same trade-off documents/avatars already accept.
   */
  async uploadProof(
    ownerId: string,
    file: UploadedFile,
  ): Promise<{ url: string }> {
    const key = `payments/${ownerId}/${randomUUID()}${fileExtension(file.name)}`;
    const { url } = await getStorage().upload({
      key,
      body: file.bytes,
      contentType: file.type,
    });
    return { url };
  },

  /**
   * Correct a recorded payment.
   *
   * The issued receipt is corrected in step with it — same receipt number, new
   * figures — and its cached PDF is dropped so the next render rebuilds it
   * (`generatePdf` returns early while `pdfUrl` is set). The tenant is NOT
   * re-emailed: re-sending a receipt they already have is the owner's call.
   */
  async update(ownerId: string, input: UpdatePaymentInput) {
    const payment = await prisma.payment.findFirst({
      where: { id: input.id, ownerId, deletedAt: null },
      include: {
        receipt: { select: { id: true, number: true } },
        contract: { select: { monthlyRent: true, currency: true, dueDay: true } },
      },
    });
    if (!payment) throw new NotFoundError('Payment');

    const isDeposit = input.type === PaymentType.DEPOSIT;
    const monthlyRent = Number(payment.contract.monthlyRent);
    const balanceAfter = isDeposit
      ? 0
      : Math.max(0, monthlyRent - input.amount);
    const prefs = await getUserPreferences(ownerId);
    // Rent covers a due-day-to-due-day period, regardless of when it was paid.
    const rentPeriod = isDeposit
      ? null
      : (input.periodStart ??
        rentPeriodStart(input.paidAt, payment.contract.dueDay));
    const concept =
      input.concept ??
      defaultConcept(rentPeriod ?? input.paidAt, isDeposit, prefs.locale);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: input.amount,
          type: input.type,
          method: input.method,
          reference: input.reference ?? null,
          concept,
          proofUrl: input.proofUrl || null,
          periodStart: rentPeriod,
          paidAt: input.paidAt,
          notes: input.notes ?? null,
        },
      });

      if (payment.receipt) {
        await tx.receipt.update({
          where: { id: payment.receipt.id },
          data: {
            amount: input.amount,
            concept,
            balanceAfter,
            issuedAt: input.paidAt,
            // Force a re-render with the corrected figures.
            pdfUrl: null,
          },
        });
      }

      await logActivity({
        tx,
        ownerId,
        action: ActivityAction.UPDATED,
        entityType: 'Payment',
        entityId: payment.id,
        summary: `Corrected a payment to ${formatCurrency(input.amount, payment.contract.currency)}`,
        messageKey: 'paymentUpdated',
        params: {
          amount: formatCurrency(input.amount, payment.contract.currency),
        },
      });
    });

    // Rebuild the PDF post-commit so a slow render never blocks the write.
    if (payment.receipt) {
      void receiptService
        .generatePdf(ownerId, payment.receipt.id)
        .catch((error) =>
          console.error('[payments] receipt re-render failed', error),
        );
    }

    return { id: payment.id };
  },

  /**
   * Permanently delete a payment, its receipt and both blobs (receipt PDF +
   * uploaded proof). A deliberate exception to the app's soft-delete rule: the
   * owner wants voided payments gone, not archived.
   *
   * Order matters — rows first, blobs after. If storage cleanup fails we're
   * left with orphan blobs (harmless, sweepable later); deleting blobs first
   * could strand a live receipt pointing at a missing PDF.
   */
  async remove(ownerId: string, id: string) {
    // Capture what we need to locate the blobs before the rows disappear.
    const payment = await prisma.payment.findFirst({
      where: { id, ownerId, deletedAt: null },
      select: {
        id: true,
        proofUrl: true,
        receipt: { select: { number: true } },
      },
    });
    if (!payment) throw new NotFoundError('Payment');

    // Cascades the receipt row (Receipt.payment onDelete: Cascade).
    await paymentRepository.hardDelete(ownerId, id);

    const keys: string[] = [];
    if (payment.receipt) {
      keys.push(`receipts/${ownerId}/${payment.receipt.number}.pdf`);
    }
    const proofKey = storageKeyFromPublicUrl(payment.proofUrl);
    if (proofKey) keys.push(proofKey);

    if (keys.length > 0) {
      try {
        await getStorage().remove(keys);
      } catch (error) {
        console.error('[payments] blob cleanup after delete failed', error);
      }
    }

    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Payment',
      entityId: id,
      summary: 'Deleted a payment',
      messageKey: 'paymentDeleted',
    });
    return { id };
  },
};
