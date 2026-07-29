'use client';

import { createContext, useContext, useMemo } from 'react';
import {
  makeDateFormatter,
  toDateFormat,
  type DateFormatter,
} from '@/shared/lib/date-format';

const DateFormatContext = createContext<{
  dateFormat: string;
  locale: string;
}>({ dateFormat: 'MEDIUM', locale: 'en' });

/**
 * Supplies the owner's date-format preference + active locale to client
 * components. Mounted once in the app shell; server components use
 * `getFormatDate()` instead.
 */
export function DateFormatProvider({
  dateFormat,
  locale,
  children,
}: {
  dateFormat: string;
  locale: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ dateFormat, locale }), [dateFormat, locale]);
  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

/** Client-side date formatter bound to the owner's preference + locale. */
export function useFormatDate(): DateFormatter {
  const { dateFormat, locale } = useContext(DateFormatContext);
  return useMemo(
    () => makeDateFormatter(toDateFormat(dateFormat), locale),
    [dateFormat, locale],
  );
}
