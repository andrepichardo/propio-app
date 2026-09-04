import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MailCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('verifyEmail') };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
        <MailCheck className="size-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('verify.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {email
            ? t.rich('verify.bodyWithEmail', {
                email,
                b: (chunks) => (
                  <span className="text-foreground font-medium">{chunks}</span>
                ),
              })
            : t('verify.bodyNoEmail')}
        </p>
      </div>
      {email && (
        <p className="text-muted-foreground text-xs">{t('verify.spamHint')}</p>
      )}
      <ResendVerificationForm initialEmail={email} />
      <Button variant="ghost" asChild>
        <Link href="/login">{t('verify.backToSignIn')}</Link>
      </Button>
    </div>
  );
}
