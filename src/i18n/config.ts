/**
 * Supported locales. `en` = English (US), `es` = Latin-American Spanish.
 * The active locale lives in a cookie (see `locale.ts`) so it persists across
 * visits without any URL prefix, and is mirrored to `User.locale` when signed in.
 */
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
