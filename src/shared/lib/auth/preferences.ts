import 'server-only';
import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';

export type UserPreferences = {
  currency: string;
  locale: string;
  dateFormat: string;
};

const DEFAULTS: UserPreferences = {
  currency: 'USD',
  locale: 'en',
  dateFormat: 'MEDIUM',
};

/**
 * Load an owner's formatting preferences (currency/locale/date style). Cached
 * per request so the many components that format money don't each query.
 *
 * There is deliberately no timezone here: domain dates are date-only values
 * stored at UTC midnight (a contract ends on a calendar day, not at an
 * instant), so shifting them by an offset would move them a day. The one place
 * a real clock matters — the dashboard greeting — reads the browser's clock on
 * the client, which is more accurate than any stored preference.
 */
export const getUserPreferences = cache(
  async (userId: string): Promise<UserPreferences> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currency: true,
        locale: true,
        dateFormat: true,
      },
    });
    if (!user) return DEFAULTS;
    return {
      currency: user.currency,
      locale: user.locale,
      dateFormat: user.dateFormat,
    };
  },
);
