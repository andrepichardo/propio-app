/**
 * Currencies offered in the app, in display order (USD and DOP first — the
 * primary markets — then the rest of the supported LatAm set). Kept in sync
 * with `CURRENCY_SYMBOLS` in `format.ts`: every code here formats with a proper
 * prefix. Names are translated via the `currencies` message namespace.
 */
export const CURRENCY_CODES = [
  'USD',
  'DOP',
  'MXN',
  'COP',
  'ARS',
  'CLP',
  'PEN',
  'GTQ',
  'CRC',
  'EUR',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];
