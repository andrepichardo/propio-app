'use server';

import { revalidatePath } from 'next/cache';
import { createOwnerAction, createOwnerQueryAction } from '@/shared/lib/action';
import { billingService } from '../services/billing.service';
import { changePlanSchema } from '../validators/billing.validators';

export const changePlanAction = createOwnerAction(
  changePlanSchema,
  async ({ plan, interval }, { ownerId }) => {
    await billingService.changePlan(ownerId, plan, interval);
    revalidatePath('/app/billing');
    return { plan };
  },
);

export const openBillingPortalAction = createOwnerQueryAction(
  async ({ ownerId }) => ({ url: await billingService.portalUrl(ownerId) }),
);
