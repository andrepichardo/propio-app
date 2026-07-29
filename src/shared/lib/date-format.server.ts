import 'server-only';
import { getLocale } from 'next-intl/server';
import { requireOwnerId } from './auth/session';
import { getUserPreferences } from './auth/preferences';
import {
  makeDateFormatter,
  toDateFormat,
  type DateFormatter,
} from './date-format';

/**
 * Date formatter bound to the signed-in owner's preference and the active UI
 * locale. Use in server components instead of `formatDate` with a raw pattern.
 */
export async function getFormatDate(): Promise<DateFormatter> {
  const [ownerId, locale] = await Promise.all([requireOwnerId(), getLocale()]);
  const { dateFormat } = await getUserPreferences(ownerId);
  return makeDateFormatter(toDateFormat(dateFormat), locale);
}
