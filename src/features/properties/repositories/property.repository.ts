import 'server-only';
import { PropertyStatus, type PropertyType } from '@/generated/prisma/enums';
import { type Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type PropertyListItem = Prisma.PropertyGetPayload<{
  select: {
    id: true;
    name: true;
    type: true;
    status: true;
    city: true;
    country: true;
    coverImageUrl: true;
    createdAt: true;
    _count: { select: { contracts: true } };
  };
}>;

type ListParams = {
  search?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'status';
  sortDir?: 'asc' | 'desc';
};

/**
 * Property data access. All reads exclude soft-deleted rows and are scoped by
 * `ownerId`. Never call Prisma for properties outside this module.
 */
export const propertyRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<PropertyListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);

    const where: Prisma.PropertyWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { city: { contains: params.search, mode: 'insensitive' } },
              { addressLine: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortDir ?? 'asc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          city: true,
          country: true,
          coverImageUrl: true,
          createdAt: true,
          _count: { select: { contracts: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  findById(ownerId: string, id: string) {
    return prisma.property.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: {
        photos: { orderBy: { position: 'asc' } },
        _count: {
          select: { contracts: true, documents: true, expenses: true },
        },
      },
    });
  },

  create(ownerId: string, data: Omit<Prisma.PropertyCreateInput, 'owner'>) {
    return prisma.property.create({
      data: { ...data, owner: { connect: { id: ownerId } } },
    });
  },

  async update(ownerId: string, id: string, data: Prisma.PropertyUpdateInput) {
    // Guard ownership with updateMany, then return the fresh row.
    const result = await prisma.property.updateMany({
      where: { id, ownerId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return prisma.property.findUnique({ where: { id } });
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.property.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },

  /** Aggregate counts by status for the dashboard, in a single query. */
  async statusCounts(ownerId: string): Promise<Record<PropertyStatus, number>> {
    const grouped = await prisma.property.groupBy({
      by: ['status'],
      where: { ownerId, deletedAt: null },
      _count: { _all: true },
    });

    const base: Record<PropertyStatus, number> = {
      [PropertyStatus.AVAILABLE]: 0,
      [PropertyStatus.OCCUPIED]: 0,
      [PropertyStatus.MAINTENANCE]: 0,
    };
    for (const row of grouped) base[row.status] = row._count._all;
    return base;
  },

  countActive(ownerId: string): Promise<number> {
    return prisma.property.count({
      where: { ownerId, deletedAt: null },
    });
  },

  /** Lightweight option list for select inputs (contracts, payments forms). */
  options(ownerId: string) {
    return prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  },

  // --- Photos ---------------------------------------------------------------

  createPhoto(data: {
    propertyId: string;
    url: string;
    storageKey: string;
    position: number;
  }) {
    return prisma.propertyPhoto.create({ data });
  },

  /** Fetch a photo, enforcing that its parent property belongs to the owner. */
  findPhoto(ownerId: string, photoId: string) {
    return prisma.propertyPhoto.findFirst({
      where: { id: photoId, property: { ownerId, deletedAt: null } },
      include: {
        property: { select: { id: true, coverImageUrl: true } },
      },
    });
  },

  deletePhoto(photoId: string) {
    return prisma.propertyPhoto.delete({ where: { id: photoId } });
  },

  firstPhoto(propertyId: string) {
    return prisma.propertyPhoto.findFirst({
      where: { propertyId },
      orderBy: { position: 'asc' },
    });
  },

  setCoverImage(propertyId: string, url: string | null) {
    return prisma.property.update({
      where: { id: propertyId },
      data: { coverImageUrl: url },
    });
  },
};
