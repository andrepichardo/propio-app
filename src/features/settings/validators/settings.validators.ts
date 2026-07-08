import { z } from 'zod';

/** Identity fields shown on the Profile page. */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
});

/** Formatting preferences shown on the Settings page. */
export const updatePreferencesSchema = z.object({
  currency: z
    .string()
    .length(3, 'Use a 3-letter ISO code (e.g. USD).')
    .transform((v) => v.toUpperCase()),
  locale: z.string().min(2).max(10).default('en'),
  timezone: z.string().min(1).max(60).default('UTC'),
});

/** In-app password change. Mirrors the registration password policy. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password is too long.')
      .regex(/[a-z]/, 'Include a lowercase letter.')
      .regex(/[A-Z]/, 'Include an uppercase letter.')
      .regex(/[0-9]/, 'Include a number.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: 'New password must be different from the current one.',
    path: ['password'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
