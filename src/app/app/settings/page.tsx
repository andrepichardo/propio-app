import type { Metadata } from 'next';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { PreferencesForm } from '@/features/settings/components/preferences-form';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      currency: true,
      locale: true,
      timezone: true,
      hashedPassword: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Preferences and account security."
      />
      <PreferencesForm
        defaultValues={{
          currency: user.currency,
          locale: user.locale,
          timezone: user.timezone,
        }}
      />
      <ChangePasswordForm hasPassword={Boolean(user.hashedPassword)} />
    </div>
  );
}
