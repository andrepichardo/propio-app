import 'server-only';

/** Exchange rates expressed as "units of currency per 1 USD" (API base = USD). */
type UsdRates = Record<string, number>;

export type Converter = (amount: number, from: string) => number;

/**
 * Live exchange rates from the free, key-less open.er-api.com (base USD,
 * covers DOP and the LatAm set). Next caches the response for 24h, so rates
 * refresh automatically once a day without a cron or external dependency.
 * On any failure returns `{}` — the converter then falls back to 1:1.
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
 * missing-rate amounts pass through unchanged so a total is never dropped.
 */
export function makeConverter(rates: UsdRates, target: string): Converter {
  return (amount, from) => {
    if (!amount || from === target) return amount;
    const rf = rates[from];
    const rt = rates[target];
    if (!rf || !rt) return amount;
    return amount * (rt / rf);
  };
}
