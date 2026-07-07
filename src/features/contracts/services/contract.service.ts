import 'server-only';
import { ActivityAction, PropertyStatus } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { contractRepository } from '../repositories/contract.repository';
import type {
  ContractFilters,
  CreateContractInput,
  UpdateContractInput,
} from '../validators/contract.validators';
import { ForbiddenError, NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { getStorage } from '@/shared/lib/storage';
import type { UploadedFile } from '@/shared/lib/uploads';

/**
 * Verify a property and tenant both belong to the owner before we link them
 * in a contract. Prevents a crafted request from attaching another tenant's
 * data across the tenant boundary.
 */
async function assertOwnership(
  ownerId: string,
  propertyId: string,
  tenantId: string,
): Promise<void> {
  const [property, tenant] = await Promise.all([
    prisma.property.findFirst({
      where: { id: propertyId, ownerId, deletedAt: null },
      select: { id: true },
    }),
    prisma.tenant.findFirst({
      where: { id: tenantId, ownerId, deletedAt: null },
      select: { id: true },
    }),
  ]);
  if (!property || !tenant) {
    throw new ForbiddenError('Property or tenant not found in your account.');
  }
}

export const contractService = {
  list(ownerId: string, filters: ContractFilters) {
    return contractRepository.list(ownerId, filters);
  },

  async getById(ownerId: string, id: string) {
    const contract = await contractRepository.findById(ownerId, id);
    if (!contract) throw new NotFoundError('Contract');
    return contract;
  },

  async create(ownerId: string, input: CreateContractInput) {
    await assertOwnership(ownerId, input.propertyId, input.tenantId);

    const contract = await contractRepository.create(ownerId, {
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      monthlyRent: input.monthlyRent,
      currency: input.currency,
      dueDay: input.dueDay,
      securityDeposit: input.securityDeposit,
      maintenanceIncluded: input.maintenanceIncluded,
      status: input.status,
      notes: input.notes,
      ownerId,
    });

    // An active contract implies the property is occupied.
    if (input.status === 'ACTIVE') {
      await prisma.property.updateMany({
        where: { id: input.propertyId, ownerId },
        data: { status: PropertyStatus.OCCUPIED },
      });
    }

    await logActivity({
      ownerId,
      action: ActivityAction.CREATED,
      entityType: 'Contract',
      entityId: contract.id,
      summary: 'Created a new contract',
    });

    return contract;
  },

  async update(ownerId: string, input: UpdateContractInput) {
    const { id, ...rest } = input;
    if (rest.propertyId && rest.tenantId) {
      await assertOwnership(ownerId, rest.propertyId, rest.tenantId);
    }
    const updated = await contractRepository.update(ownerId, id, {
      ...rest,
      endDate: rest.endDate ?? undefined,
    });
    if (!updated) throw new NotFoundError('Contract');

    await logActivity({
      ownerId,
      action: ActivityAction.UPDATED,
      entityType: 'Contract',
      entityId: updated.id,
      summary: 'Updated a contract',
    });

    return updated;
  },

  async remove(ownerId: string, id: string) {
    const deleted = await contractRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Contract');
    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Contract',
      entityId: id,
      summary: 'Cancelled a contract',
    });
    return { id };
  },

  /** Attach the signed contract PDF (upserts a fixed key per contract). */
  async setContractPdf(ownerId: string, id: string, file: UploadedFile) {
    const contract = await contractRepository.findById(ownerId, id);
    if (!contract) throw new NotFoundError('Contract');

    const key = `contracts/${ownerId}/${id}/contract.pdf`;
    const { url } = await getStorage().upload({
      key,
      body: file.bytes,
      contentType: file.type,
      upsert: true,
    });

    await contractRepository.update(ownerId, id, {
      contractPdfUrl: `${url}?v=${Date.now()}`,
    });

    await logActivity({
      ownerId,
      action: ActivityAction.UPDATED,
      entityType: 'Contract',
      entityId: id,
      summary: 'Attached the signed contract PDF',
    });

    return { id };
  },
};
