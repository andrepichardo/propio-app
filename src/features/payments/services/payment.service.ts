import 'server-only';
import {
  ActivityAction,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { format } from 'date-fns';
import { prisma } from '@/shared/lib/prisma';
import { paymentRepository } from '../repositories/payment.repository';
import type {
  PaymentFilters,
  RegisterPaymentInput,
} from '../validators/payment.validators';
import { ForbiddenError, NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency } from '@/shared/lib/format';
import { getStorage } from '@/shared/lib/storage';
import { renderReceiptPdf } from '@/pdf/render';
import { sendReceiptEmail } from '@/emails/send';
import { PAYMENT_METHOD_LABELS } from '../constants';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { clientEnv } from '@/shared/config/env';

/**
 * Generate the next per-owner receipt number for the current year, e.g.
 * `REC-2026-0007`. Runs inside the payment transaction so the count can't race
 * with a concurrent registration.
 */
async function nextReceiptNumber(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.receipt.count({
    where: { ownerId, number: { startsWith: `REC-${year}-` } },
  });
  return `REC-${year}-${String(count + 1).padStart(4, '0')}`;
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

    const monthlyRent = Number(contract.monthlyRent);
    const balanceAfter = Math.max(0, monthlyRent - input.amount);
    const concept =
      input.concept ??
      `Rent — ${format(input.periodStart ?? input.paidAt, 'MMMM yyyy')}`;

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
          status: 'COMPLETED',
          reference: input.reference,
          concept,
          periodStart: input.periodStart,
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
      });

      return { payment, receipt };
    });

    // --- Post-commit side effects (best-effort) -----------------------------
    void this.finalizeReceipt({
      ownerId,
      receiptId: receipt.id,
      number: receipt.number,
      concept,
      amount: input.amount,
      balanceAfter,
      currency: contract.currency,
      method: input.method,
      reference: input.reference,
      issuedAt: input.paidAt,
      tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      tenantEmail: contract.tenant.email,
      propertyName: contract.property.name,
      sendReceipt: input.sendReceipt,
    });

    if (balanceAfter > 0) {
      await prisma.notification.create({
        data: {
          ownerId,
          type: NotificationType.PAYMENT_UPCOMING,
          title: 'Partial payment recorded',
          body: `${contract.tenant.firstName} still owes ${formatCurrency(balanceAfter, contract.currency)} on ${contract.property.name}.`,
          entityType: 'Contract',
          entityId: contract.id,
          actionUrl: `/app/contracts/${contract.id}`,
        },
      });
    }

    return { id: payment.id, receiptNumber: receipt.number };
  },

  /**
   * Render the receipt PDF, persist it to storage, cache the URL, and email it
   * to the tenant when requested. Isolated so failures here never surface to
   * the payment registration path.
   */
  async finalizeReceipt(params: {
    ownerId: string;
    receiptId: string;
    number: string;
    concept: string;
    amount: number;
    balanceAfter: number;
    currency: string;
    method: keyof typeof PAYMENT_METHOD_LABELS;
    reference?: string;
    issuedAt: Date;
    tenantName: string;
    tenantEmail?: string | null;
    propertyName: string;
    sendReceipt: boolean;
  }): Promise<void> {
    try {
      const owner = await prisma.user.findUnique({
        where: { id: params.ownerId },
        select: { name: true, email: true },
      });
      const prefs = await getUserPreferences(params.ownerId);

      const pdf = await renderReceiptPdf({
        number: params.number,
        issuedAt: format(params.issuedAt, 'PPP'),
        concept: params.concept,
        amount: formatCurrency(params.amount, params.currency, prefs.locale),
        balanceAfter: formatCurrency(
          params.balanceAfter,
          params.currency,
          prefs.locale,
        ),
        method: PAYMENT_METHOD_LABELS[params.method],
        reference: params.reference,
        ownerName: owner?.name ?? owner?.email ?? 'Owner',
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        appName: clientEnv.NEXT_PUBLIC_APP_NAME,
      });

      const { url } = await getStorage().upload({
        key: `receipts/${params.ownerId}/${params.number}.pdf`,
        body: pdf,
        contentType: 'application/pdf',
      });

      await prisma.receipt.update({
        where: { id: params.receiptId },
        data: { pdfUrl: url },
      });

      if (params.sendReceipt && params.tenantEmail) {
        await sendReceiptEmail({
          to: params.tenantEmail,
          tenantName: params.tenantName,
          amount: formatCurrency(params.amount, params.currency, prefs.locale),
          receiptNumber: params.number,
          pdf,
        });
      }
    } catch (error) {
      console.error('[payments] finalizeReceipt failed', error);
    }
  },

  async remove(ownerId: string, id: string) {
    const deleted = await paymentRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Payment');
    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Payment',
      entityId: id,
      summary: 'Voided a payment',
    });
    return { id };
  },
};
