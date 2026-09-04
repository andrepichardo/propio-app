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
        <p className="text-muted-foreground text-sm">{t('login.subtitle')}</p>
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
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p>
              {error === 'OAuthAccountNotLinked'
                ? t('login.oauthAccountNotLinked')
                : error === 'Configuration'
                  ? // Auth.js collapses CallbackRouteError into "Configuration",
                    // which reads like an app bug but covers ANY failure in the
                    // callback (token exchange, profile fetch, adapter write).
                    // Deliberately does not name a cause: only the server log's
                    // `[auth][cause]` line knows which one it was.
                    t('login.oauthMisconfigured')
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
        <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
          {t('login.orContinueEmail')}
        </span>
      </div>

      <LoginForm />

      <p className="text-muted-foreground text-center text-sm">
        {t('login.noAccount')}{' '}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline"
        >
          {t('login.createOne')}
        </Link>
      </p>
    </div>
  );
}
