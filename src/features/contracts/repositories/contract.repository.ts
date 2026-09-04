import 'server-only';
import type { ContractStatus } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type ContractListItem = Prisma.ContractGetPayload<{
  select: {
    id: true;
    status: true;
    startDate: true;
    endDate: true;
    monthlyRent: true;
    currency: true;
    dueDay: true;
    property: { select: { id: true; name: true } };
    tenant: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

type ListParams = {
  status?: ContractStatus;
  propertyId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
};

const listSelect = {
  id: true,
  status: true,
  startDate: true,
  endDate: true,
  monthlyRent: true,
  currency: true,
  dueDay: true,
  property: { select: { id: true, name: true } },
  tenant: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ContractSelect;

export const contractRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<ContractListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const where: Prisma.ContractWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      ...(params.tenantId ? { tenantId: params.tenantId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: listSelect,
      }),
      prisma.contract.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  findById(ownerId: string, id: string) {
    return prisma.contract.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: {
        property: { select: { id: true, name: true } },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        // Renewal chain neighbours, so the detail page can walk the history.
        renewedFrom: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
          },
        },
        renewedTo: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
          },
        },
        _count: { select: { payments: true } },
      },
    });
  },

  create(ownerId: string, data: Prisma.ContractUncheckedCreateInput) {
    return prisma.contract.create({ data: { ...data, ownerId } });
  },

  async update(ownerId: string, id: string, data: Prisma.ContractUpdateInput) {
    const result = await prisma.contract.updateMany({
      where: { id, ownerId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return prisma.contract.findUnique({ where: { id } });
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.contract.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    return result.count > 0;
  },

  /** Active contracts for a tenant/property pairing — used by payments. */
  activeOptions(ownerId: string) {
    return prisma.contract.findMany({
      where: { ownerId, deletedAt: null, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        monthlyRent: true,
        currency: true,
        dueDay: true,
        // The term bounds which rent periods the payment form may offer.
        startDate: true,
        endDate: true,
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    });
  },
};
