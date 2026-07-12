import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/shared/components/ui/button';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('resetPassword') };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const t = await getTranslations('auth');

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('reset.invalidTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('reset.invalidBody')}</p>
        <Button asChild>
          <Link href="/forgot-password">{t('reset.requestNew')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('reset.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('reset.subtitle')}</p>
      </div>
      <ResetPasswordForm token={token} email={email} />
    </div>
  );
}
