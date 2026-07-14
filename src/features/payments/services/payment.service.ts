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
import { receiptService } from '@/features/receipts/services/receipt.service';
import { sendReceiptEmail } from '@/emails/send';
import { getUserPreferences } from '@/shared/lib/auth/preferences';

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
      amount: input.amount,
      currency: contract.currency,
      tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      tenantEmail: contract.tenant.email,
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
    sendReceipt: boolean;
  }): Promise<void> {
    try {
      const result = await receiptService.generatePdf(
        params.ownerId,
        params.receiptId,
      );

      if (params.sendReceipt && params.tenantEmail) {
        const prefs = await getUserPreferences(params.ownerId);
        await sendReceiptEmail({
          to: params.tenantEmail,
          tenantName: params.tenantName,
          amount: formatCurrency(params.amount, params.currency, prefs.locale),
          receiptNumber: params.number,
          pdf: result?.pdf,
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
