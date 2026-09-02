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
  return (
    typeof value === 'string' && (locales as readonly string[]).includes(value)
  );
}

/** Catalog locale for a stored preference, which may be a BCP-47 tag ("es-DO"). */
export function toLocale(value: string | undefined | null): Locale {
  const primary = value?.slice(0, 2);
  return isLocale(primary) ? primary : defaultLocale;
}

/**
 * Locale for number/currency formatting. Never pass a stored preference to
 * `Intl` directly: bare `es` is Spain, which groups 40.000,00 — every market
 * this app serves writes 40,000.00, so Spanish maps to `es-DO`.
 */
export function numberLocale(value: string | undefined | null): string {
  return toLocale(value) === 'es' ? 'es-DO' : 'en-US';
}
