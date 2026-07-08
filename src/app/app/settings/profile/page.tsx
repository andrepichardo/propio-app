import type { Metadata } from 'next';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfileSettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true, image: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        description="Your photo and personal information."
      />
      <ProfileForm
        email={user.email}
        image={user.image}
        defaultValues={{ name: user.name ?? '' }}
      />
    </div>
  );
}
