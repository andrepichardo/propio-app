import { format, formatDistanceToNow, type Locale } from 'date-fns';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Money is stored as Prisma `Decimal` (serialised to string over the wire).
 * These helpers accept string | number | null so they compose with raw DB
 * values without callers having to coerce first.
 */
type Numeric = string | number | null | undefined;

export function toNumber(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Short symbols for the currencies we expect. USD is deliberately a bare "$"
 * (the app default needs no disambiguation); everything else carries its
 * local prefix so mixed portfolios stay readable. Unlisted codes fall back
 * to Intl's own formatting ("XYZ 1,200.00").
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  DOP: 'RD$',
  EUR: '€',
  MXN: 'MX$',
  COP: 'CO$',
  PEN: 'S/',
  CLP: 'CL$',
  ARS: 'AR$',
  GTQ: 'Q',
  CRC: '₡',
};

export function formatCurrency(
  value: Numeric,
  currency = 'USD',
  locale = 'en-US',
): string {
  const n = toNumber(value);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!symbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  const digits = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
  return `${n < 0 ? '-' : ''}${symbol}${digits}`;
}

export function formatCompactCurrency(
  value: Numeric,
  currency = 'USD',
  locale = 'en-US',
): string {
  const n = toNumber(value);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!symbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }
  const digits = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(n));
  return `${n < 0 ? '-' : ''}${symbol}${digits}`;
}

export function formatPercent(value: Numeric, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

/**
 * Date-only values (contract start, payment date…) are persisted at UTC
 * midnight. Formatting them with local-time getters west of UTC (e.g.
 * UTC-4) would show the previous day, so those are rebuilt from their UTC
 * parts before formatting. Real timestamps pass through untouched.
 */
function toDisplayDate(date: Date): Date {
  const isUtcMidnight = date.getTime() % 86_400_000 === 0;
  return isUtcMidnight
    ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    : date;
}

export function formatDate(
  value: Date | string | null | undefined,
  pattern = 'MMM d, yyyy',
  options?: { locale?: Locale },
): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(toDisplayDate(date), pattern, options);
}

/** Value for `<input type="date">` (`yyyy-MM-dd`), timezone-shift safe. */
export function toDateInputValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (match) return match[0];
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return format(toDisplayDate(date), 'yyyy-MM-dd');
}

/** Human-readable international phone (`+1 809 555 1234`); raw fallback. */
export function formatPhone(value?: string | null): string {
  if (!value) return '—';
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}

export function formatRelative(
  value: Date | string | null | undefined,
): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getInitials(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
