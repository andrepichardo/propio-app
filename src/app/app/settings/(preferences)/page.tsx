import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { prisma } from '@/shared/lib/prisma';
import { PreferencesForm } from '@/features/settings/components/preferences-form';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { PageHeader } from '@/shared/components/page-header';
import { toDateFormat } from '@/shared/lib/date-format';

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
      dateFormat: true,
      hashedPassword: true,
      notifyContractExpiring: true,
      contractExpiringLeadDays: true,
      notifyPaymentUpcoming: true,
      paymentUpcomingLeadDays: true,
      notifyPaymentLate: true,
      notifyByEmail: true,
    },
  });

  const t = await getTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <PreferencesForm
        defaultValues={{
          currency: user.currency,
          dateFormat: toDateFormat(user.dateFormat),
          notifyContractExpiring: user.notifyContractExpiring,
          contractExpiringLeadDays: user.contractExpiringLeadDays,
          notifyPaymentUpcoming: user.notifyPaymentUpcoming,
          paymentUpcomingLeadDays: user.paymentUpcomingLeadDays,
          notifyPaymentLate: user.notifyPaymentLate,
          notifyByEmail: user.notifyByEmail,
        }}
      />
      <ChangePasswordForm hasPassword={Boolean(user.hashedPassword)} />
    </div>
  );
}
