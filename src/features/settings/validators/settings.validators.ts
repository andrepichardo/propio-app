import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  currency: z
    .string()
    .length(3, 'Use a 3-letter ISO code (e.g. USD).')
    .transform((v) => v.toUpperCase()),
  locale: z.string().min(2).max(10).default('en'),
  timezone: z.string().min(1).max(60).default('UTC'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
