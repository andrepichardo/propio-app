import 'server-only';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from '@/shared/types/pagination';
import { NotFoundError } from '@/shared/lib/errors';

export type ReceiptListItem = Awaited<
  ReturnType<typeof receiptService.list>
>['items'][number];

/** Owner-scoped read access for receipts (write path lives in payments). */
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
