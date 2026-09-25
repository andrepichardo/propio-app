'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatDate } from '@/shared/components/date-format-provider';

const noopSubscribe = () => () => {};

/**
 * "Renews on …" / "Ends on …" for a Paddle billing period.
 *
 * Unlike every other date in the app, a period end is an INSTANT, not a
 * date-only value: a subscription bought at 20:01 in the Dominican Republic
 * ends at 00:01 UTC the next day. The server (UTC on Vercel, no timezone
 * preference stored) would print that next day, so the calendar day is taken
 * from the browser's clock instead. The first render repeats the server's
 * output so hydration matches; the local day follows right after.
 */
export function PeriodEndLine({
  kind,
  periodEnd,
}: {
  kind: 'renewsOn' | 'cancelsOn';
  periodEnd: string;
}) {
  const t = useTranslations('billing');
  const formatDate = useFormatDate();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const instant = new Date(periodEnd);
  // `formatDate` reads UTC calendar fields; rebuild the LOCAL day at UTC
  // midnight so it prints the day the owner actually sees on their clock.
  const day = hydrated
    ? new Date(
        Date.UTC(instant.getFullYear(), instant.getMonth(), instant.getDate()),
      )
    : instant;

  return <>{t(kind, { date: formatDate(day) })}</>;
}
