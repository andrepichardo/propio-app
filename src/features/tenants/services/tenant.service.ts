import 'server-only';
import { ActivityAction } from '@prisma/client';
import { tenantRepository } from '../repositories/tenant.repository';
import type {
  CreateTenantInput,
  TenantFilters,
  UpdateTenantInput,
} from '../validators/tenant.validators';
import { NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { getStorage } from '@/shared/lib/storage';
import { fileExtension, type UploadedFile } from '@/shared/lib/uploads';

function normalize(input: Partial<CreateTenantInput>) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email || undefined,
    phone: input.phone,
    identification: input.identification,
    avatarUrl: input.avatarUrl || undefined,
    emergencyName: input.emergencyName,
    emergencyPhone: input.emergencyPhone,
    emergencyRelation: input.emergencyRelation,
    notes: input.notes,
  };
}

export const tenantService = {
  list(ownerId: string, filters: TenantFilters) {
    return tenantRepository.list(ownerId, filters);
  },

  options(ownerId: string) {
    return tenantRepository.options(ownerId);
  },

  async getById(ownerId: string, id: string) {
    const tenant = await tenantRepository.findById(ownerId, id);
    if (!tenant) throw new NotFoundError('Tenant');
    return tenant;
  },

  async create(ownerId: string, input: CreateTenantInput) {
    const tenant = await tenantRepository.create(ownerId, {
      ...normalize(input),
      firstName: input.firstName,
      lastName: input.lastName,
    });
    await logActivity({
      ownerId,
      action: ActivityAction.CREATED,
      entityType: 'Tenant',
      entityId: tenant.id,
      summary: `Added tenant ${tenant.firstName} ${tenant.lastName}`,
      messageKey: 'tenantAdded',
      params: { name: `${tenant.firstName} ${tenant.lastName}` },
    });
    return tenant;
  },

  async update(ownerId: string, input: UpdateTenantInput) {
    const { id, ...rest } = input;
    const updated = await tenantRepository.update(ownerId, id, normalize(rest));
    if (!updated) throw new NotFoundError('Tenant');
    await logActivity({
      ownerId,
      action: ActivityAction.UPDATED,
      entityType: 'Tenant',
      entityId: updated.id,
      summary: `Updated tenant ${updated.firstName} ${updated.lastName}`,
      messageKey: 'tenantUpdated',
      params: { name: `${updated.firstName} ${updated.lastName}` },
    });
    return updated;
  },

  async remove(ownerId: string, id: string) {
    const deleted = await tenantRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Tenant');
    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Tenant',
      entityId: id,
      summary: 'Deleted a tenant',
      messageKey: 'tenantDeleted',
    });
    return { id };
  },

  /** Upload a profile photo and set it as the tenant's avatar. */
  async setAvatar(ownerId: string, tenantId: string, file: UploadedFile) {
    const tenant = await tenantRepository.findById(ownerId, tenantId);
    if (!tenant) throw new NotFoundError('Tenant');

    // Fixed key per tenant (upsert) + cache-busting query so the new image
    // shows immediately despite CDN/browser caching of the public URL.
    const key = `tenants/${ownerId}/${tenantId}/avatar${fileExtension(file.name)}`;
    const { url } = await getStorage().upload({
      key,
      body: file.bytes,
      contentType: file.type,
      upsert: true,
    });

    const updated = await tenantRepository.update(ownerId, tenantId, {
      avatarUrl: `${url}?v=${Date.now()}`,
    });
    if (!updated) throw new NotFoundError('Tenant');
    return { avatarUrl: updated.avatarUrl };
  },
};
