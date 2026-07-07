'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction } from '@/shared/lib/action';
import { propertyService } from '../services/property.service';
import {
  createPropertySchema,
  deletePropertySchema,
  updatePropertySchema,
} from '../validators/property.validators';

export const createPropertyAction = createOwnerAction(
  createPropertySchema,
  async (input, { ownerId }) => {
    const property = await propertyService.create(ownerId, input);
    revalidatePath('/app/properties');
    revalidatePath('/app');
    return { id: property.id };
  },
);

export const updatePropertyAction = createOwnerAction(
  updatePropertySchema,
  async (input, { ownerId }) => {
    const property = await propertyService.update(ownerId, input);
    revalidatePath('/app/properties');
    revalidatePath(`/app/properties/${property.id}`);
    return { id: property.id };
  },
);

export const deletePropertyAction = createOwnerAction(
  deletePropertySchema,
  async ({ id }, { ownerId }) => {
    const result = await propertyService.remove(ownerId, id);
    revalidatePath('/app/properties');
    revalidatePath('/app');
    return result;
  },
);
