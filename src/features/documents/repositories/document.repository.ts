import 'server-only';
import type { DocumentType, Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from '@/shared/types/pagination';

export type DocumentListItem = Prisma.DocumentGetPayload<{
  select: {
    id: true;
    name: true;
    type: true;
    url: true;
    mimeType: true;
    sizeBytes: true;
    createdAt: true;
    property: { select: { id: true; name: true } };
    tenant: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

type ListParams = {
  type?: DocumentType;
  propertyId?: string;
  page?: number;
  pageSize?: number;
};

export const documentRepository = {
  async list(
    ownerId: string,
    params: ListParams,
  ): Promise<PaginatedResult<DocumentListItem>> {
    const { page, pageSize, skip, take } = normalizePagination(params);
    const where: Prisma.DocumentWhereInput = {
      ownerId,
      deletedAt: null,
      ...(params.type ? { type: params.type } : {}),
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          type: true,
          url: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
          property: { select: { id: true, name: true } },
          tenant: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  },

  findById(ownerId: string, id: string) {
    return prisma.document.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
  },

  create(data: Prisma.DocumentUncheckedCreateInput) {
    return prisma.document.create({ data });
  },

  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const result = await prisma.document.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },
};
