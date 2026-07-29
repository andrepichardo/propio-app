import { z } from 'zod';

/** Identity fields shown on the Profile page. Messages are `validation` keys. */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'nameRequired').max(80),
});

/**
 * Preferences shown on the Settings page: money formatting + reminder settings
 * (consumed by the daily notification scheduler), saved together with one
 * submit. Language lives in the topbar switcher (it sets the cookie AND mirrors
 * to `User.locale`), so it's intentionally not here.
 *
 * Lead days are only meaningful when their toggle is on, but we always
 * validate/persist them so turning a reminder back on restores the last value.
 */
export const updatePreferencesSchema = z.object({
  currency: z
    .string()
    .length(3, 'currencyCode')
    .transform((v) => v.toUpperCase()),
  notifyContractExpiring: z.boolean(),
  contractExpiringLeadDays: z.coerce
    .number()
    .int('leadDaysInvalid')
    .min(1, 'leadDaysInvalid')
    .max(180, 'leadDaysInvalid'),
  notifyPaymentUpcoming: z.boolean(),
  paymentUpcomingLeadDays: z.coerce
    .number()
    .int('leadDaysInvalid')
    .min(0, 'leadDaysInvalid')
    .max(30, 'leadDaysInvalid'),
  notifyPaymentLate: z.boolean(),
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
