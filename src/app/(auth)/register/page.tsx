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
        <p className="text-muted-foreground text-sm">
          {t('register.subtitle')}
        </p>
      </div>

      <OAuthButtons />

      <div className="relative">
        <Separator />
        <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
          {t('register.orSignUpEmail')}
        </span>
      </div>

      <RegisterForm />

      <p className="text-muted-foreground text-center text-sm">
        {t('register.haveAccount')}{' '}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
