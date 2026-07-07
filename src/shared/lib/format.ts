import { format, formatDistanceToNow } from 'date-fns';

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

export function formatCurrency(
  value: Numeric,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatCompactCurrency(
  value: Numeric,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

export function formatPercent(value: Numeric, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

export function formatDate(
  value: Date | string | null | undefined,
  pattern = 'MMM d, yyyy',
): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, pattern);
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
