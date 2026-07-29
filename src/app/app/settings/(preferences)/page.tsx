import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { PreferencesForm } from '@/features/settings/components/preferences-form';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('settings') };
}

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      currency: true,
      timezone: true,
      hashedPassword: true,
    },
  });

  const t = await getTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <PreferencesForm
        defaultValues={{
          currency: user.currency,
          timezone: user.timezone,
        }}
      />
      <ChangePasswordForm hasPassword={Boolean(user.hashedPassword)} />
    </div>
  );
}
