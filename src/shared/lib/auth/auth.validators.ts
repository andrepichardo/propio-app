import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Validation messages are i18n keys (namespace `validation`); `FormMessage`
// translates them at render time, so schemas stay shared between client & server.
export const registerSchema = z
  .object({
    name: z.string().min(2, 'nameRequired').max(80),
    email: z.string().email('email'),
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
  });

export const loginSchema = z.object({
  email: z.string().email('email'),
  password: z.string().min(1, 'passwordRequired'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('email'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'passwordMin').max(72, 'passwordMax'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMatch',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
