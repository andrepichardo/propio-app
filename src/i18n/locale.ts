import 'server-only';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';

/**
 * Resolve the active locale for the current request:
 *   1. an explicit choice saved in the cookie, else
 *   2. the best match from the browser's `Accept-Language`, else
 *   3. the default locale.
 * Read-only — safe to call during rendering (cookie writes happen in actions).
 */
export async function getUserLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  return detectFromAcceptLanguage(
    (await headers()).get('accept-language') ?? '',
  );
}

/** Parse `Accept-Language` (e.g. "es-419,es;q=0.9,en;q=0.8") and return the
 * first supported language, comparing on the primary subtag. */
export function detectFromAcceptLanguage(header: string): Locale {
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase();
    const primary = tag?.split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return defaultLocale;
}
