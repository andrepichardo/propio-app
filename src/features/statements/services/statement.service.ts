import 'server-only';
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
} from 'date-fns';
import { es as esDateLocale } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import {
  ActivityAction,
  PaymentStatus,
  PaymentType,
  type Prisma,
} from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import type {
  GenerateStatementInput,
  StatementFilters,
} from '../validators/statement.validators';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/shared/lib/errors';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency } from '@/shared/lib/format';
import { getStorage } from '@/shared/lib/storage';
import { renderStatementPdf, type StatementLine } from '@/pdf/render';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { clientEnv } from '@/shared/config/env';
import { defaultLocale, isLocale } from '@/i18n/config';

/** Per-owner sequential number, e.g. `STM-2026-0003`. Runs inside the tx. */
async function nextStatementNumber(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STM-${year}-`;
  // Derived from the highest existing number, not a count: statements can be
  // deleted, and a count would reuse a live number and hit the unique index.
  const latest = await tx.statement.findFirst({
    where: { ownerId, number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  const nextSeq = latest ? Number(latest.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

const listSelect = {
  id: true,
  number: true,
  periodStart: true,
  periodEnd: true,
  totalCharged: true,
  totalPaid: true,
  outstanding: true,
  currency: true,
  pdfUrl: true,
  createdAt: true,
  tenant: { select: { firstName: true, lastName: true } },
  property: { select: { name: true } },
} satisfies Prisma.StatementSelect;

export type StatementListItem = Prisma.StatementGetPayload<{
  select: typeof listSelect;
}>;

export const statementService = {
  async list(
    ownerId: string,
    params: StatementFilters,
  ): Promise<PaginatedResult<StatementListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const [items, total] = await Promise.all([
      prisma.statement.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: listSelect,
      }),
      prisma.statement.count({ where: { ownerId } }),
    ]);
    return buildPaginatedResult(items, total, page, pageSize);
  },

  /**
   * Permanently delete a statement and its PDF. A statement is a re-generatable
   * summary, so it's hard-deleted (like payments) rather than archived; the
   * `ownerId` in the filter keeps it tenant-scoped.
   */
  async remove(ownerId: string, id: string) {
    const statement = await prisma.statement.findFirst({
      where: { id, ownerId },
      select: { id: true, number: true },
    });
    if (!statement) throw new NotFoundError('Statement');

    await prisma.statement.deleteMany({ where: { id, ownerId } });

    // Best-effort blob cleanup — an orphan PDF is harmless, a failed delete
    // shouldn't be.
    try {
      await getStorage().remove(
        `statements/${ownerId}/${statement.number}.pdf`,
      );
    } catch (error) {
      console.error('[statements] pdf cleanup after delete failed', error);
    }

    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Statement',
      entityId: id,
      summary: 'Deleted a statement',
      messageKey: 'statementDeleted',
    });
    return { id };
  },

  /**
   * Generate a monthly statement for a contract: charges vs payments for the
   * period, outstanding balance, and next due date. The record is written
   * atomically; PDF rendering + upload happen post-commit (same pattern as
   * receipts) so slow I/O never blocks the write.
   */
  async generate(ownerId: string, input: GenerateStatementInput) {
    const contract = await prisma.contract.findFirst({
      where: { id: input.contractId, ownerId, deletedAt: null },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!contract) {
      throw new ForbiddenError('Contract not found in your account.');
    }

    const periodStart = startOfMonth(input.month);
    const periodEnd = endOfMonth(input.month);

    const existing = await prisma.statement.findFirst({
      where: { ownerId, contractId: contract.id, periodStart },
      select: { number: true },
    });
    if (existing) {
      throw new ConflictError(
        `Statement ${existing.number} already covers this period.`,
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        ownerId,
        contractId: contract.id,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        // A rent statement reflects rent paid, not deposits held.
        type: { not: PaymentType.DEPOSIT },
        paidAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { paidAt: 'asc' },
      select: { paidAt: true, concept: true, amount: true },
    });

    const totalCharged = Number(contract.monthlyRent);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Math.max(0, totalCharged - totalPaid);
    const dueDay = Math.min(contract.dueDay, 28);
    const nextMonth = addMonths(periodStart, 1);
    const nextDueDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      dueDay,
    );

    const statement = await prisma.$transaction(async (tx) => {
      const number = await nextStatementNumber(tx, ownerId);
      const created = await tx.statement.create({
        data: {
          ownerId,
          contractId: contract.id,
          propertyId: contract.propertyId,
          tenantId: contract.tenantId,
          number,
          periodStart,
          periodEnd,
          totalCharged,
          totalPaid,
          outstanding,
          nextDueDate,
          currency: contract.currency,
        },
      });

      await logActivity({
        tx,
        ownerId,
        action: ActivityAction.STATEMENT_GENERATED,
        entityType: 'Statement',
        entityId: created.id,
        summary: `Generated statement ${number} for ${contract.property.name}`,
        messageKey: 'statementGenerated',
        params: { number, property: contract.property.name },
      });

      return created;
    });

    void this.finalizePdf({
      ownerId,
      statementId: statement.id,
      number: statement.number,
      periodStart,
      currency: contract.currency,
      totalCharged,
      totalPaid,
      outstanding,
      nextDueDate,
      tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      propertyName: contract.property.name,
      lines: payments.map((p) => ({
        // Raw date; localised in finalizePdf where the owner's locale is known.
        date: p.paidAt,
        concept: p.concept ?? 'Payment',
        amount: Number(p.amount),
      })),
    });

    return { id: statement.id, number: statement.number };
  },

  /** Render + upload the statement PDF and cache its URL. Best-effort. */
  async finalizePdf(params: {
    ownerId: string;
    statementId: string;
    number: string;
    periodStart: Date;
    currency: string;
    totalCharged: number;
    totalPaid: number;
    outstanding: number;
    nextDueDate: Date;
    tenantName: string;
    propertyName: string;
    lines: { date: Date; concept: string; amount: number }[];
  }): Promise<void> {
    try {
      const [owner, prefs] = await Promise.all([
        prisma.user.findUnique({
          where: { id: params.ownerId },
          select: { name: true, email: true },
        }),
        getUserPreferences(params.ownerId),
      ]);

      // The PDF renders post-commit (outside the request), so the owner's
      // locale must be resolved here — the cookie fallback doesn't apply.
      const locale = isLocale(prefs.locale.slice(0, 2))
        ? (prefs.locale.slice(0, 2) as typeof defaultLocale)
        : defaultLocale;
      const dfOpts = locale === 'es' ? { locale: esDateLocale } : undefined;
      // Full month name: "8 de mayo" (es) / "May 8" (en).
      const lineDateFmt = locale === 'es' ? "d 'de' MMMM" : 'MMMM d';
      const t = await getTranslations({ locale, namespace: 'pdf.statement' });

      const money = (value: number) =>
        formatCurrency(value, params.currency, prefs.locale);

      const lines: StatementLine[] = params.lines.map((line) => ({
        date: format(line.date, lineDateFmt, dfOpts),
        concept: line.concept,
        amount: money(line.amount),
      }));

      const pdf = await renderStatementPdf({
        number: params.number,
        periodLabel: format(params.periodStart, 'MMMM yyyy', dfOpts),
        ownerName: owner?.name ?? owner?.email ?? 'Owner',
        tenantName: params.tenantName,
        propertyName: params.propertyName,
        lines,
        totalCharged: money(params.totalCharged),
        totalPaid: money(params.totalPaid),
        outstanding: money(params.outstanding),
        nextDueDate: format(params.nextDueDate, 'PPP', dfOpts),
        appName: clientEnv.NEXT_PUBLIC_APP_NAME,
        labels: {
          title: t('title'),
          subtitle: t('subtitle'),
          tenant: t('tenant'),
          owner: t('owner'),
          date: t('date'),
          concept: t('concept'),
          amount: t('amount'),
          noPayments: t('noPayments'),
          totalCharged: t('totalCharged'),
          totalPaid: t('totalPaid'),
          outstanding: t('outstanding'),
          nextDue: t('nextDue', { date: format(params.nextDueDate, 'PPP', dfOpts) }),
          generatedBy: t('generatedBy', {
            app: clientEnv.NEXT_PUBLIC_APP_NAME,
          }),
        },
      });

      const { url } = await getStorage().upload({
        key: `statements/${params.ownerId}/${params.number}.pdf`,
        body: pdf,
        contentType: 'application/pdf',
      });

      await prisma.statement.update({
        where: { id: params.statementId },
        data: { pdfUrl: url },
      });
    } catch (error) {
      console.error('[statements] finalizePdf failed', error);
    }
  },
};
