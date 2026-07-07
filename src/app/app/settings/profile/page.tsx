import type { Metadata } from 'next';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default async function ProfileSettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      currency: true,
      locale: true,
      timezone: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile and formatting preferences."
      />
      <ProfileForm
        email={user.email}
        defaultValues={{
          name: user.name ?? '',
          currency: user.currency,
          locale: user.locale,
          timezone: user.timezone,
        }}
      />
    </div>
  );
}
