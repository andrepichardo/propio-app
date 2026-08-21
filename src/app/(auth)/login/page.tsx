import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { Separator } from '@/shared/components/ui/separator';
import { LoginForm } from '@/features/auth/components/login-form';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('signIn') };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string; email?: string }>;
}) {
  const { verified, error, email } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('login.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      {verified === '1' && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{t('login.verifiedBanner')}</p>
        </div>
      )}

      {/* Any error Auth.js sends here that is NOT our own verification-link
          code. `pages.error` points at /login, so without this branch an OAuth
          failure (OAuthAccountNotLinked, OAuthCallback, AccessDenied…) bounced
          the user back to a pristine login form with no explanation at all.
          The raw code is shown small so a failure stays diagnosable. */}
      {error && error !== 'verification' && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p>
              {error === 'OAuthAccountNotLinked'
                ? t('login.oauthAccountNotLinked')
                : t('login.oauthFailed')}
            </p>
            <p className="font-mono text-xs opacity-70">{error}</p>
          </div>
        </div>
      )}

      {error === 'verification' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            {t('login.linkInvalid')}{' '}
            <Link
              href={`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="font-medium underline underline-offset-2"
            >
              {t('login.requestNew')}
            </Link>
            .
          </p>
        </div>
      )}

      <OAuthButtons />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          {t('login.orContinueEmail')}
        </span>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          {t('login.createOne')}
        </Link>
      </p>
    </div>
  );
}
