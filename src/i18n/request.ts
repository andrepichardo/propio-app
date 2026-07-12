import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from './locale';

/**
 * next-intl request configuration. Runs on the server for every request and
 * feeds the resolved locale + message catalog to both server and client
 * components. We use a cookie-based locale (no URL prefix).
 */
export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
