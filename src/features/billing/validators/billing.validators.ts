import { z } from 'zod';
import { BillingInterval, Plan } from '@/generated/prisma/enums';

export const changePlanSchema = z.object({
  plan: z.enum([Plan.PRO, Plan.BUSINESS]),
  interval: z.nativeEnum(BillingInterval),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;
