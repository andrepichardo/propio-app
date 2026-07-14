import { getRequestConfig } from 'next-intl/server';
import { isLocale } from './config';
import { getUserLocale } from './locale';

/**
 * next-intl request configuration. Runs on the server for every request and
 * feeds the resolved locale + message catalog to both server and client
 * components. We use a cookie-based locale (no URL prefix).
 *
 * When a caller passes an explicit locale — e.g.
 * `getTranslations({ locale, namespace })` for receipt PDFs/emails rendered
 * in the OWNER's language — honour it without touching `cookies()`. That
 * keeps this config usable outside a request scope (`after()` callbacks).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isLocale(requested) ? requested : await getUserLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
