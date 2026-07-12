'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import { getCurrentUser } from '@/shared/lib/auth/session';
import { LOCALE_COOKIE, isLocale, type Locale } from './config';

/**
 * Persist the user's language choice: always in the cookie (so it survives
 * across visits), and — when signed in — mirrored to `User.locale` so it
 * follows the account. Called by the language selector; the client refreshes
 * afterwards to re-render with the new messages.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { locale },
    });
  }
}
