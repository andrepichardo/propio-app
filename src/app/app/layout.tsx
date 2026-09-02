import { redirect } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { getUnreadNotificationCount } from '@/features/notifications/services/notification.service';
import { Logo } from '@/shared/components/brand/logo';
import { SidebarNav } from '@/shared/components/layout/sidebar-nav';
import { Topbar } from '@/shared/components/layout/topbar';
import { VerifyEmailBanner } from '@/shared/components/layout/verify-email-banner';
import { DateFormatProvider } from '@/shared/components/date-format-provider';

/**
 * Authenticated application shell. Middleware already guards `/app/**`, but we
 * re-check here so server components downstream can assume a user exists.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const [unreadCount, account, locale] = await Promise.all([
    getUnreadNotificationCount(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        emailVerified: true,
        hashedPassword: true,
        name: true,
        image: true,
        dateFormat: true,
        locale: true,
      },
    }),
    getLocale(),
  ]);

  // Only credential accounts need in-app verification — OAuth providers
  // already verified the address.
  const needsVerification = Boolean(
    account?.hashedPassword && !account.emailVerified,
  );

  // Keep the stored language in step with the one actually in use. The cookie
  // is the source of truth for the UI, but `User.locale` is the ONLY locale a
  // receipt PDF, statement or digest email can read — those render outside a
  // request — so a mismatch means Spanish screens and English documents. It
  // happens whenever the switcher ran while signed out (landing/login pages
  // mount it too, and `setLocale` can mirror nothing without a session) or the
  // language came from `Accept-Language`, never from an explicit pick.
  if (account && account.locale !== locale) {
    after(async () => {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { locale },
        });
      } catch (error) {
        console.error('[i18n] could not mirror the active locale', error);
      }
    });
  }

  // `minmax(0,1fr)` + `min-w-0` on the content column: with a plain `1fr`
  // (= `minmax(auto,1fr)`) the column cannot shrink below its min-content
  // width, so a wide table (payments, contracts…) widens the whole document
  // instead of scrolling inside its own container.
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/app">
            <Logo />
          </Link>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Prefer DB values for name/image: the JWT snapshot goes stale after
            profile edits (avatar upload, rename) until the next sign-in. */}
        <Topbar
          user={{
            ...user,
            name: account?.name ?? user.name,
            image: account?.image ?? null,
          }}
          unreadCount={unreadCount}
        />
        {needsVerification ? <VerifyEmailBanner /> : null}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <DateFormatProvider
              dateFormat={account?.dateFormat ?? 'MEDIUM'}
              locale={locale}
            >
              {children}
            </DateFormatProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
