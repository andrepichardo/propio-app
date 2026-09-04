import 'server-only';
import { randomUUID } from 'crypto';
import {
  ActivityAction,
  NotificationType,
  PaymentStatus,
  PaymentType,
} from '@/generated/prisma/enums';
import { type Prisma } from '@/generated/prisma/client';
import { es as esDateLocale } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/shared/lib/prisma';
import { getStorage } from '@/shared/lib/storage';
import { fileExtension, type UploadedFile } from '@/shared/lib/uploads';
import { paymentRepository } from '../repositories/payment.repository';
import type {
  PaymentFilters,
  RegisterPaymentInput,
  UpdatePaymentInput,
} from '../validators/payment.validators';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { receiptService } from '@/features/receipts/services/receipt.service';
import { sendReceiptEmail } from '@/emails/send';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { numberLocale, toLocale } from '@/i18n/config';
import {
  contractAnchorDay,
  isPeriodWithinTerm,
  monthRangeOf,
  periodToMonthValue,
  rentPeriodEnd,
  rentPeriodStart,
} from '@/shared/lib/rent-period';
import {
  isPeriodCovered,
  rentBalanceAfter,
  settlesRentPeriod,
} from '@/shared/lib/rent-settlement';
import {
  nextReceiptNumber,
  receiptNumberPrefix,
} from '@/shared/lib/receipt-number';
import { storageKeyFromPublicUrl } from '@/shared/lib/storage/public-url';

/**
 * Localized default concept, used when the owner leaves the field blank. Rent
 * shows the period it covers as a date range ("Alquiler 15 de julio – 15 de
 * agosto" / "Rent July 15 – August 15"); a deposit is just labelled. Stored
 * verbatim, so it's built in the owner's language at creation — not
 * re-translated at render.
 *
 * Both ends go through the UTC-midnight-aware helpers (`formatDate`,
 * `rentPeriodEnd`), never bare date-fns: a period is a date-only value, and
 * `format`/`addMonths` read it in the SERVER's local time. That is invisible on
 * Vercel (UTC) and wrong everywhere else — at UTC-4 a 1 May period printed
 * "Alquiler 30 de abril – 30 de mayo" on the tenant's receipt.
 */
function defaultConcept(
  baseDate: Date,
  isDeposit: boolean,
  locale: string,
): string {
  const isEs = locale.startsWith('es');
  if (isDeposit) return isEs ? 'Depósito de garantía' : 'Security deposit';

  const pattern = isEs ? "d 'de' MMMM" : 'MMMM d';
  const opts = isEs ? { locale: esDateLocale } : undefined;
  const start = formatDate(baseDate, pattern, opts);
  const end = formatDate(rentPeriodEnd(baseDate), pattern, opts);
  return `${isEs ? 'Alquiler' : 'Rent'} ${start} – ${end}`;
}

/**
 * Reserve the next receipt number for this owner. Runs inside the payment
 * transaction; the numbering rule itself lives in `receipt-number.ts` and is
 * unit-tested there.
 *
 * It is a read-then-write, so it does NOT serialise on its own: two truly
 * concurrent registrations both read the same MAX and propose the same number.
 * `@@unique([ownerId, number])` is what actually guarantees uniqueness — the
 * loser's whole transaction rolls back and the caller retries (see
 * `isReceiptNumberCollision`).
 */
async function reserveReceiptNumber(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const latest = await tx.receipt.findFirst({
    where: { ownerId, number: { startsWith: receiptNumberPrefix(year) } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return nextReceiptNumber(latest?.number, year);
}

/**
 * Whether a thrown error is the unique-constraint rejection two concurrent
 * registrations race into (P2002 on `receipts.number`).
 *
 * Matched structurally instead of with `instanceof PrismaClientKnownRequestError`
 * so this file keeps its type-only import of the Prisma namespace.
 */
function isReceiptNumberCollision(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { code, meta } = error as {
    code?: string;
    meta?: { target?: unknown };
  };
  return (
    code === 'P2002' && JSON.stringify(meta?.target ?? '').includes('number')
  );
}

/** Attempts at the registration transaction before a collision gives up. */
const RECEIPT_NUMBER_RETRIES = 3;

/**
 * Run the registration transaction, retrying a lost receipt-number race.
 *
 * The rejected transaction rolled back whole — no payment row, no receipt — so
 * a retry simply re-reads the MAX and takes the next free number. Without it
 * the P2002 escapes as a non-`AppError` and the owner is told "something went
 * wrong" for a payment that is perfectly valid.
 */
async function withReceiptNumberRetry<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await write();
    } catch (error) {
      if (
        attempt >= RECEIPT_NUMBER_RETRIES ||
        !isReceiptNumberCollision(error)
      ) {
        throw error;
      }
    }
  }
}

/**
 * Money already on a rent period, from the contract's OTHER payments.
 *
 * Two callers depend on it and must agree with `coveredPeriods` (and therefore
 * with the dashboard): the guard that refuses to register a second payment on
 * a month that is already settled, and `rentBalanceAfter`, which needs the
 * running total rather than this payment alone.
 *
 * Matched by MONTH, not by an exact `periodStart`, for the same reason
 * `coveredPeriods` buckets by month: rows written before periods were anchored
 * to the contract's start day sit on the old due-day anchor, and a contract
 * whose start date was corrected has rows on the previous one. Rows predating
 * `periodStart` are matched by `paidAt`, which is what `rentPeriodStart` would
 * anchor them from.
 */
async function periodTally(params: {
  ownerId: string;
  contractId: string;
  period: Date;
  excludePaymentId?: string;
}): Promise<{ paid: number; settled: boolean }> {
  const { ownerId, contractId, period, excludePaymentId } = params;
  const withinMonth = monthRangeOf(period);

  const rows = await prisma.payment.findMany({
    where: {
      ownerId,
      contractId,
      deletedAt: null,
      status: PaymentStatus.COMPLETED,
      // Deposits settle no rent period.
      type: { not: PaymentType.DEPOSIT },
      id: excludePaymentId ? { not: excludePaymentId } : undefined,
      OR: [
        { periodStart: withinMonth },
        { periodStart: null, paidAt: withinMonth },
      ],
    },
    select: { amount: true, settlesPeriod: true },
  });

  return {
    paid: rows.reduce((total, row) => total + Number(row.amount), 0),
    settled: rows.some((row) => row.settlesPeriod),
  };
}

export const paymentService = {
  list(ownerId: string, filters: PaymentFilters) {
    return paymentRepository.list(ownerId, filters);
  },

  /**
   * Rent periods that already have enough money on them, per contract, as
   * `yyyy-MM` values. The payment form uses it twice: to preselect the first
   * unpaid month (so a prepayment doesn't silently land on the month that is
   * already settled) and to refuse a second payment on one — `register`
   * enforces the same rule server-side via `periodTally`.
   *
   * Coverage is decided by `isPeriodCovered`, the same rule the dashboard uses
   * for "upcoming payments" — they must agree or the form would suggest a
   * month the dashboard still shows as due.
   */
  async coveredPeriods(
    ownerId: string,
    contracts: { id: string; monthlyRent: number; anchorDay: number }[],
  ): Promise<Record<string, string[]>> {
    if (contracts.length === 0) return {};

    const byId = new Map(contracts.map((c) => [c.id, c]));
    const now = new Date();
    // A year back is enough to judge every month the form can suggest, and
    // bounds the scan on a contract with years of history.
    const since = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));

    const rows = await prisma.payment.findMany({
      where: {
        ownerId,
        contractId: { in: [...byId.keys()] },
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        // Deposits settle no rent period.
        type: { not: PaymentType.DEPOSIT },
        paidAt: { gte: since },
      },
      select: {
        contractId: true,
        amount: true,
        paidAt: true,
        periodStart: true,
        settlesPeriod: true,
      },
    });

    const paid = new Map<string, number>();
    const settled = new Set<string>();
    for (const row of rows) {
      const contract = byId.get(row.contractId);
      if (!contract) continue;
      // Legacy rows predate `periodStart`; anchor them the same way a new
      // payment would be.
      const period =
        row.periodStart ?? rentPeriodStart(row.paidAt, contract.anchorDay);
      const key = `${row.contractId}:${periodToMonthValue(period)}`;
      paid.set(key, (paid.get(key) ?? 0) + Number(row.amount));
      if (row.settlesPeriod) settled.add(key);
    }

    const covered: Record<string, string[]> = {};
    for (const [key, amount] of paid) {
      const separator = key.indexOf(':');
      const contractId = key.slice(0, separator);
      const contract = byId.get(contractId);
      if (!contract) continue;
      const isCovered = isPeriodCovered({
        paid: amount,
        monthlyRent: contract.monthlyRent,
        settled: settled.has(key),
      });
      if (isCovered) {
        (covered[contractId] ??= []).push(key.slice(separator + 1));
      }
    }
    return covered;
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
    const settlesPeriod = settlesRentPeriod(isDeposit, input.settlesPeriod);
    const prefs = await getUserPreferences(ownerId);
    // Rent covers a start-day-to-start-day period, whenever it was paid.
    const rentPeriod = isDeposit
      ? undefined
      : rentPeriodStart(
          input.periodStart ?? input.paidAt,
          contractAnchorDay(contract.startDate),
        );

    // A period the contract does not cover belongs to no term at all — the
    // form bounds the picker, this is what a stale or forged payload hits.
    if (rentPeriod && !isPeriodWithinTerm(rentPeriod, contract)) {
      const t = await getTranslations('payments.errors');
      throw new ConflictError(t('periodOutsideContract'));
    }

    // A month that is already settled takes no second payment: there is no
    // credit concept, so the money would be recorded without advancing
    // anything. The form guards this too — this is the guarantee, since a
    // stale page can still submit a month that was paid meanwhile.
    const tally = rentPeriod
      ? await periodTally({
          ownerId,
          contractId: contract.id,
          period: rentPeriod,
        })
      : { paid: 0, settled: false };
    if (
      rentPeriod &&
      isPeriodCovered({ paid: tally.paid, monthlyRent, settled: tally.settled })
    ) {
      const t = await getTranslations('payments.errors');
      throw new ConflictError(t('periodAlreadyPaid'));
    }

    const balanceAfter = rentBalanceAfter({
      amount: input.amount,
      alreadyPaid: tally.paid,
      monthlyRent,
      isDeposit,
      settlesPeriod,
    });
    const concept =
      input.concept ??
      defaultConcept(rentPeriod ?? input.paidAt, isDeposit, prefs.locale);

    // --- Atomic write: payment + receipt + activity -------------------------
    const { payment, receipt } = await withReceiptNumberRetry(() =>
      prisma.$transaction(async (tx) => {
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
            settlesPeriod,
            paidAt: input.paidAt,
            notes: input.notes,
          },
        });

        const number = await reserveReceiptNumber(tx, ownerId);
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
      }),
    );

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
        await sendReceiptEmail({
          to: params.tenantEmail,
          tenantName: params.tenantName,
          amount: formatCurrency(
            params.amount,
            params.currency,
            numberLocale(prefs.locale),
          ),
          receiptNumber: params.number,
          propertyName: params.propertyName,
          ownerName: owner?.name,
          pdf: result?.pdf,
          locale: toLocale(prefs.locale),
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
        contract: {
          select: {
            monthlyRent: true,
            currency: true,
            // startDate anchors the period; endDate bounds which are payable.
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    if (!payment) throw new NotFoundError('Payment');

    const isDeposit = input.type === PaymentType.DEPOSIT;
    const monthlyRent = Number(payment.contract.monthlyRent);
    const settlesPeriod = settlesRentPeriod(isDeposit, input.settlesPeriod);
    const prefs = await getUserPreferences(ownerId);
    // Rent covers a start-day-to-start-day period, whenever it was paid.
    const rentPeriod = isDeposit
      ? null
      : rentPeriodStart(
          input.periodStart ?? input.paidAt,
          contractAnchorDay(payment.contract.startDate),
        );

    // Both of registration's guards apply here, minus this payment — but only
    // for a MOVE to another month. Correcting a payment in place has to keep
    // working on rows registered before the guards existed (a duplicate month,
    // a period outside the term), or the fix would strand exactly what it
    // exists to prevent. A payment that was a DEPOSIT has no previous month,
    // so becoming rent always counts as a move.
    const previousMonth =
      payment.type === PaymentType.DEPOSIT
        ? null
        : periodToMonthValue(
            payment.periodStart ??
              rentPeriodStart(
                payment.paidAt,
                contractAnchorDay(payment.contract.startDate),
              ),
          );
    const movedPeriod =
      rentPeriod !== null && periodToMonthValue(rentPeriod) !== previousMonth;

    if (
      rentPeriod &&
      movedPeriod &&
      !isPeriodWithinTerm(rentPeriod, payment.contract)
    ) {
      const t = await getTranslations('payments.errors');
      throw new ConflictError(t('periodOutsideContract'));
    }

    const tally = rentPeriod
      ? await periodTally({
          ownerId,
          contractId: payment.contractId,
          period: rentPeriod,
          excludePaymentId: payment.id,
        })
      : { paid: 0, settled: false };
    if (
      movedPeriod &&
      isPeriodCovered({ paid: tally.paid, monthlyRent, settled: tally.settled })
    ) {
      const t = await getTranslations('payments.errors');
      throw new ConflictError(t('periodAlreadyPaid'));
    }

    const balanceAfter = rentBalanceAfter({
      amount: input.amount,
      alreadyPaid: tally.paid,
      monthlyRent,
      isDeposit,
      settlesPeriod,
    });
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
          settlesPeriod,
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
