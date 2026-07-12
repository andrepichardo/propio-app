import Link from 'next/link';
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
          <Link href="/" className="w-fit">
            <Logo />
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-center px-16 text-primary-foreground">
          <blockquote className="max-w-md text-2xl font-medium leading-relaxed text-balance">
            {t('heroQuote')}
          </blockquote>
          <p className="mt-6 text-sm text-primary-foreground/80">
            {t('heroAttribution')}
          </p>
        </div>
      </div>
    </div>
  );
}
