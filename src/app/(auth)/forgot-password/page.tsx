import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('forgotPassword') };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('forgot.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('forgot.subtitle')}</p>
      </div>

      <ForgotPasswordForm />

      <p className="text-muted-foreground text-center text-sm">
        {t('forgot.remembered')}{' '}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          {t('forgot.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
