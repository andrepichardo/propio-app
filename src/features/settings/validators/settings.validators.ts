import { z } from 'zod';

/** Identity fields shown on the Profile page. Messages are `validation` keys. */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'nameRequired').max(80),
});

/**
 * Formatting preferences shown on the Settings page. Language lives in the
 * topbar switcher (it sets the cookie AND mirrors to `User.locale`), so it's
 * intentionally not here.
 */
export const updatePreferencesSchema = z.object({
  currency: z
    .string()
    .length(3, 'currencyCode')
    .transform((v) => v.toUpperCase()),
});

/** In-app password change. Mirrors the registration password policy. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPasswordRequired'),
    password: z
      .string()
      .min(8, 'passwordMin')
      .max(72, 'passwordMax')
      .regex(/[a-z]/, 'passwordLower')
      .regex(/[A-Z]/, 'passwordUpper')
      .regex(/[0-9]/, 'passwordNumber'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMatch',
    path: ['confirmPassword'],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: 'passwordDifferent',
    path: ['password'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
