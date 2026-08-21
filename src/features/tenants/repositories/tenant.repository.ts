import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type TenantListItem = Prisma.TenantGetPayload<{
  select: {
    id: true;
    firstName: true;
    lastName: true;
    email: true;
    phone: true;
    avatarUrl: true;
    createdAt: true;
    _count: { select: { contracts: true } };
  };
}>;

type ListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

/** Owner-scoped, soft-delete-aware data access for tenants. */
export const tenantRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<TenantListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);

    const where: Prisma.TenantWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { contracts: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  findById(ownerId: string, id: string) {
    return prisma.tenant.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: {
        _count: {
          select: { contracts: true, payments: true, documents: true },
        },
      },
    });
  },

  /** Lightweight option list for select inputs (contracts, payments forms). */
  options(ownerId: string) {
    return prisma.tenant.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    });
  },

  create(ownerId: string, data: Omit<Prisma.TenantCreateInput, 'owner'>) {
    return prisma.tenant.create({
      data: { ...data, owner: { connect: { id: ownerId } } },
    });
  },

  async update(ownerId: string, id: string, data: Prisma.TenantUpdateInput) {
    const result = await prisma.tenant.updateMany({
      where: { id, ownerId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return prisma.tenant.findUnique({ where: { id } });
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.tenant.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },

  count(ownerId: string): Promise<number> {
    return prisma.tenant.count({ where: { ownerId, deletedAt: null } });
  },
};
