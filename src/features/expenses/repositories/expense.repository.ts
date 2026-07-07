import 'server-only';
import type { ExpenseCategory, Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type ExpenseListItem = Prisma.ExpenseGetPayload<{
  select: {
    id: true;
    category: true;
    description: true;
    amount: true;
    currency: true;
    incurredAt: true;
    vendor: true;
    invoiceUrl: true;
    property: { select: { id: true; name: true } };
  };
}>;

type ListParams = {
  category?: ExpenseCategory;
  propertyId?: string;
  page?: number;
  pageSize?: number;
};

const listSelect = {
  id: true,
  category: true,
  description: true,
  amount: true,
  currency: true,
  incurredAt: true,
  vendor: true,
  invoiceUrl: true,
  property: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseSelect;

export const expenseRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<ExpenseListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const where: Prisma.ExpenseWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.category ? { category: params.category } : {}),
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { incurredAt: 'desc' },
        skip,
        take,
        select: listSelect,
      }),
      prisma.expense.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  create(ownerId: string, data: Prisma.ExpenseUncheckedCreateInput) {
    return prisma.expense.create({ data: { ...data, ownerId } });
  },

  async update(
    ownerId: string,
    id: string,
    data: Prisma.ExpenseUpdateInput,
  ) {
    const result = await prisma.expense.updateMany({
      where: { id, ownerId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return prisma.expense.findUnique({ where: { id } });
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.expense.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },

  /** Category breakdown for reporting, within an optional date window. */
  async categoryBreakdown(
    ownerId: string,
    from?: Date,
    to?: Date,
  ): Promise<{ category: ExpenseCategory; total: number }[]> {
    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        ownerId,
        deletedAt: null,
        ...(from || to
          ? { incurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
      },
      _sum: { amount: true },
    });
    return grouped.map((row) => ({
      category: row.category,
      total: Number(row._sum.amount ?? 0),
    }));
  },
};
