import 'server-only';

/** Exchange rates expressed as "units of currency per 1 USD" (API base = USD). */
type UsdRates = Record<string, number>;

/**
 * Converts an amount into the target currency.
 *
 * Callers just invoke it. The two extras exist so a total can tell the truth
 * about itself: an amount that passed through UNCONVERTED (no rate available)
 * is not "approximate" — it is a different currency added in raw, which can be
 * off by orders of magnitude. Marking that with a plain `≈` would understate
 * it, so the UI needs to tell the two cases apart.
 */
export type Converter = ((amount: number, from: string) => number) & {
  /**
   * Whether `from` can actually be converted — true when a rate exists, or
   * when it is already the target (nothing to convert). Pure: safe to call in
   * any order, unlike reading {@link missing}.
   */
  canConvert: (from: string) => boolean;
  /**
   * Currencies this converter was ASKED to convert but could not, so they were
   * summed at 1:1. Populated as conversions happen — read it only after all the
   * amounts have gone through (i.e. at the end of a request).
   */
  missing: ReadonlySet<string>;
};

/**
 * Live exchange rates from the free, key-less open.er-api.com (base USD,
 * covers DOP and the LatAm set). Next caches the response for 24h, so rates
 * refresh automatically once a day without a cron or external dependency.
 * On any failure returns `{}` — every conversion then falls back to 1:1 and is
 * recorded in `missing`, so callers can warn instead of showing a wrong total.
 */
export async function getUsdRates(): Promise<UsdRates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { rates?: UsdRates };
    return data.rates ?? {};
  } catch {
    return {};
  }
}

/**
 * Build a converter to `target` using USD-based rates and a cross-rate:
 * `amount_target = amount_from × rate[target] / rate[from]`. Same-currency or
 * missing-rate amounts pass through unchanged so a total is never dropped —
 * but a missing rate is recorded, because a silent 1:1 fallback between, say,
 * DOP and USD is not a rounding error, it is a wrong number.
 */
export function makeConverter(rates: UsdRates, target: string): Converter {
  const missing = new Set<string>();

  const canConvert = (from: string): boolean =>
    from === target || Boolean(rates[from] && rates[target]);

  const convert = ((amount: number, from: string): number => {
    if (!amount || from === target) return amount;
    const rf = rates[from];
    const rt = rates[target];
    if (!rf || !rt) {
      missing.add(from);
      return amount;
    }
    return amount * (rt / rf);
  }) as Converter;

  convert.canConvert = canConvert;
  convert.missing = missing;
  return convert;
}
