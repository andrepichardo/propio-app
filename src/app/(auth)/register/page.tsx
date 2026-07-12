import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Separator } from '@/shared/components/ui/separator';
import { RegisterForm } from '@/features/auth/components/register-form';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('createAccount') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('register.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('register.subtitle')}
        </p>
      </div>

      <OAuthButtons />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          {t('register.orSignUpEmail')}
        </span>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
