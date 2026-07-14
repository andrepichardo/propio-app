import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('profile') };
}

export default async function ProfileSettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true, image: true, signatureUrl: true },
  });

  const t = await getTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('profileTitle')} description={t('profileSubtitle')} />
      <ProfileForm
        email={user.email}
        image={user.image}
        signatureUrl={user.signatureUrl}
        defaultValues={{ name: user.name ?? '' }}
      />
    </div>
  );
}
