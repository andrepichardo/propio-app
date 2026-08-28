import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/shared/lib/auth/session';
import { Button } from '@/shared/components/ui/button';
import { Logo } from '@/shared/components/brand/logo';

export default async function NotFound() {
  const [t, user] = await Promise.all([
    getTranslations('notFound'),
    getCurrentUser(),
  ]);
  const authed = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/" aria-label="Propio">
        <Logo />
      </Link>
      <div className="space-y-1">
        <p className="text-5xl font-semibold tracking-tight">404</p>
        <h1 className="text-lg font-medium">{t('title')}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <Button asChild>
        <Link href={authed ? '/app' : '/'}>
          {authed ? t('backDashboard') : t('backHome')}
        </Link>
      </Button>
    </div>
  );
}
