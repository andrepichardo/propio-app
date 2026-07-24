import { z } from 'zod';

/**
 * Centralised, type-safe environment access.
 *
 * Server code imports `env`; client code may only import `clientEnv`.
 * Validation runs once at module load so a misconfigured deployment fails
 * fast (at boot) instead of at some random request deep in the app.
 */

/**
 * Treat empty strings as "unset" — `.env` templates commonly ship `KEY=""`,
 * which must behave exactly like an absent variable.
 */
const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

const serverSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: optionalUrl,

  AUTH_SECRET: z.string().min(1),
  AUTH_URL: optionalUrl,

  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,
  AUTH_GITHUB_ID: optionalString,
  AUTH_GITHUB_SECRET: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default('Propio <no-reply@usepropio.com>'),

  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_STORAGE_BUCKET: z.string().default('propio'),

  /** Shared secret protecting /api/cron/* endpoints. */
  CRON_SECRET: optionalString,
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Propio'),
});

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time only when the
 * property is accessed statically, so we must reference each one explicitly.
 */
const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
};

function formatError(error: z.ZodError): never {
  const issues = error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`❌ Invalid environment variables:\n${issues}`);
}

const clientParsed = clientSchema.safeParse(rawClientEnv);
if (!clientParsed.success) formatError(clientParsed.error);

export const clientEnv = clientParsed.data;

/**
 * Server env is only validated on the server. Guarding on `window` keeps the
 * server schema (and its secrets) out of any client bundle.
 */
function loadServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('`env` (server) must not be imported in client code.');
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) formatError(parsed.error);
  return { ...parsed.data, ...clientEnv };
}

export const env = loadServerEnv();

export type Env = typeof env;
export type ClientEnv = typeof clientEnv;
