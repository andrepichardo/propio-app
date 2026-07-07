import 'server-only';
import { Resend } from 'resend';
import { env } from '@/shared/config/env';

/**
 * Lazily-instantiated Resend client. In local development the API key is often
 * absent — in that case we return null and callers log instead of sending, so
 * the app never crashes just because email isn't configured yet.
 */
let client: Resend | null = null;

export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export const EMAIL_FROM = env.EMAIL_FROM;
