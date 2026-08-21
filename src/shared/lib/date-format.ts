import { es as esDateLocale } from 'date-fns/locale';
import { formatDate } from './format';

/**
 * User-selectable date display styles. Numeric styles are locale-independent;
 * MEDIUM/LONG use the active UI locale for month names. Stored on `User.dateFormat`.
 */
export const DATE_FORMAT_VALUES = [
  'MEDIUM',
  'DMY',
  'MDY',
  'LONG',
  'ISO',
] as const;

export type DateFormatPref = (typeof DATE_FORMAT_VALUES)[number];

export const DEFAULT_DATE_FORMAT: DateFormatPref = 'MEDIUM';

export function isDateFormat(value: string): value is DateFormatPref {
  return (DATE_FORMAT_VALUES as readonly string[]).includes(value);
}

/** Normalize any stored string to a known preference. */
export function toDateFormat(value: string | null | undefined): DateFormatPref {
  return value && isDateFormat(value) ? value : DEFAULT_DATE_FORMAT;
}

/** date-fns pattern for a preference, given the 2-letter UI locale. */
export function dateFormatPattern(
  pref: DateFormatPref,
  locale: string,
): string {
  const isEs = locale.slice(0, 2) === 'es';
  switch (pref) {
    case 'DMY':
      return 'dd/MM/yyyy';
    case 'MDY':
      return 'MM/dd/yyyy';
    case 'ISO':
      return 'yyyy-MM-dd';
    case 'LONG':
      return isEs ? "d 'de' MMMM 'de' yyyy" : 'MMMM d, yyyy';
    case 'MEDIUM':
    default:
      return isEs ? 'd MMM yyyy' : 'MMM d, yyyy';
  }
}

export type DateFormatter = (value: Date | string | null | undefined) => string;

/**
 * Build a `formatDate`-compatible function bound to a user's preference and the
 * active UI locale. Share this via `getFormatDate()` (server) or
 * `useFormatDate()` (client) instead of calling `formatDate` with a raw pattern.
 */
export function makeDateFormatter(
  pref: DateFormatPref,
  locale: string,
): DateFormatter {
  const pattern = dateFormatPattern(pref, locale);
  const options =
    locale.slice(0, 2) === 'es' ? { locale: esDateLocale } : undefined;
  return (value) => formatDate(value, pattern, options);
}
