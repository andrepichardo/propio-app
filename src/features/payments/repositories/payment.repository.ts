import 'server-only';
import type { PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type PaymentListItem = Prisma.PaymentGetPayload<{
  select: {
    id: true;
    amount: true;
    currency: true;
    method: true;
    status: true;
    concept: true;
    paidAt: true;
    proofUrl: true;
    property: { select: { id: true; name: true } };
    tenant: { select: { id: true; firstName: true; lastName: true } };
    receipt: { select: { id: true; number: true; pdfUrl: true } };
  };
}>;

type ListParams = {
  contractId?: string;
  propertyId?: string;
  method?: PaymentMethod;
  page?: number;
  pageSize?: number;
};

const listSelect = {
  id: true,
  amount: true,
  currency: true,
  method: true,
  status: true,
  concept: true,
  paidAt: true,
  proofUrl: true,
  property: { select: { id: true, name: true } },
  tenant: { select: { id: true, firstName: true, lastName: true } },
  receipt: { select: { id: true, number: true, pdfUrl: true } },
} satisfies Prisma.PaymentSelect;

export const paymentRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<PaymentListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const where: Prisma.PaymentWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.contractId ? { contractId: params.contractId } : {}),
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      ...(params.method ? { method: params.method } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take,
        select: listSelect,
      }),
      prisma.payment.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  findById(ownerId: string, id: string) {
    return prisma.payment.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: {
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true, email: true } },
        receipt: true,
      },
    });
  },

  /** Total amount paid against a contract (completed payments only). */
  async totalPaidForContract(
    ownerId: string,
    contractId: string,
  ): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        ownerId,
        contractId,
        deletedAt: null,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.payment.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },
};
