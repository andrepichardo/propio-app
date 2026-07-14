import 'server-only';
import { ActivityAction } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { expenseRepository } from '../repositories/expense.repository';
import type {
  CreateExpenseInput,
  ExpenseFilters,
  UpdateExpenseInput,
} from '../validators/expense.validators';
import { ForbiddenError, NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency } from '@/shared/lib/format';

/** Ensure a referenced property (if any) belongs to the owner. */
async function assertPropertyOwnership(
  ownerId: string,
  propertyId?: string,
): Promise<void> {
  if (!propertyId) return;
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!property) throw new ForbiddenError('Property not found in your account.');
}

export const expenseService = {
  list(ownerId: string, filters: ExpenseFilters) {
    return expenseRepository.list(ownerId, filters);
  },

  categoryBreakdown(ownerId: string, from?: Date, to?: Date) {
    return expenseRepository.categoryBreakdown(ownerId, from, to);
  },

  async create(ownerId: string, input: CreateExpenseInput) {
    await assertPropertyOwnership(ownerId, input.propertyId);
    const expense = await expenseRepository.create(ownerId, {
      propertyId: input.propertyId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      incurredAt: input.incurredAt,
      vendor: input.vendor,
      notes: input.notes,
      invoiceUrl: input.invoiceUrl || undefined,
      ownerId,
    });

    await logActivity({
      ownerId,
      action: ActivityAction.CREATED,
      entityType: 'Expense',
      entityId: expense.id,
      summary: `Logged ${formatCurrency(input.amount, input.currency)} expense — ${input.description}`,
      messageKey: 'expenseLogged',
      params: {
        amount: formatCurrency(input.amount, input.currency),
        description: input.description,
      },
    });

    return expense;
  },

  async update(ownerId: string, input: UpdateExpenseInput) {
    const { id, ...rest } = input;
    await assertPropertyOwnership(ownerId, rest.propertyId);
    const updated = await expenseRepository.update(ownerId, id, {
      ...rest,
      invoiceUrl: rest.invoiceUrl || undefined,
    });
    if (!updated) throw new NotFoundError('Expense');
    await logActivity({
      ownerId,
      action: ActivityAction.UPDATED,
      entityType: 'Expense',
      entityId: updated.id,
      summary: 'Updated an expense',
      messageKey: 'expenseUpdated',
    });
    return updated;
  },

  async remove(ownerId: string, id: string) {
    const deleted = await expenseRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Expense');
    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Expense',
      entityId: id,
      summary: 'Deleted an expense',
      messageKey: 'expenseDeleted',
    });
    return { id };
  },
};
