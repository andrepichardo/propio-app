import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/shared/lib/auth/session';
import { Logo } from '@/shared/components/brand/logo';
import { LanguageSwitcher } from '@/shared/components/language/language-switcher';

/**
 * Layout for unauthenticated auth screens. Redirects already-signed-in users
 * straight to the app, and presents a split hero panel on large screens.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/app');

  const t = await getTranslations('auth');

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          {/* Plain <a>, not `next/link`: Next replays a stale hash from the
              route cache when navigating to `/` (`route.canonicalUrl +
              url.hash`), so a visitor who reloaded on `/#reviews` and then
              signed in would be bounced back to that section. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the full navigation is the point, see above */}
          <a href="/" className="w-fit">
            <Logo />
          </a>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="bg-primary relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="text-primary-foreground relative flex h-full flex-col justify-center px-16">
          <blockquote className="max-w-md text-2xl leading-relaxed font-medium text-balance">
            {t('heroQuote')}
          </blockquote>
          <p className="text-primary-foreground/80 mt-6 text-sm">
            {t('heroAttribution')}
          </p>
        </div>
      </div>
    </div>
  );
}
