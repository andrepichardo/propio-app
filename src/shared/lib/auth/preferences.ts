import 'server-only';
import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';

export type UserPreferences = {
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
};

const DEFAULTS: UserPreferences = {
  currency: 'USD',
  locale: 'en',
  timezone: 'UTC',
  dateFormat: 'MEDIUM',
};

/**
 * Load an owner's formatting preferences (currency/locale/timezone). Cached
 * per request so the many components that format money don't each query.
 */
export const getUserPreferences = cache(
  async (userId: string): Promise<UserPreferences> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currency: true,
        locale: true,
        timezone: true,
        dateFormat: true,
      },
    });
    if (!user) return DEFAULTS;
    return {
      currency: user.currency,
      locale: user.locale,
      timezone: user.timezone,
      dateFormat: user.dateFormat,
    };
  },
);
