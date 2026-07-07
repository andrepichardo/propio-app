'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { tenantService } from '../services/tenant.service';
import {
  createTenantSchema,
  deleteTenantSchema,
  updateTenantSchema,
} from '../validators/tenant.validators';

export const createTenantAction = createOwnerAction(
  createTenantSchema,
  async (input, { ownerId }) => {
    const tenant = await tenantService.create(ownerId, input);
    revalidatePath('/app/tenants');
    return { id: tenant.id };
  },
);

export const updateTenantAction = createOwnerAction(
  updateTenantSchema,
  async (input, { ownerId }) => {
    const tenant = await tenantService.update(ownerId, input);
    revalidatePath('/app/tenants');
    revalidatePath(`/app/tenants/${tenant.id}`);
    return { id: tenant.id };
  },
);

export const deleteTenantAction = createOwnerAction(
  deleteTenantSchema,
  async ({ id }, { ownerId }) => {
    const result = await tenantService.remove(ownerId, id);
    revalidatePath('/app/tenants');
    return result;
  },
);
