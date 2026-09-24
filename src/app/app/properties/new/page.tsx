import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { PageHeader } from '@/shared/components/page-header';
import { PropertyForm } from '@/features/properties/components/property-form';
import { billingService } from '@/features/billing/services/billing.service';
import { PlanLimitNotice } from '@/features/billing/components/plan-limit-notice';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('newProperty') };
}

export default async function NewPropertyPage() {
  const ownerId = await requireOwnerId();
  const [t, entitlements] = await Promise.all([
    getTranslations('properties.new'),
    billingService.entitlements(ownerId),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      {entitlements.canAddProperty ? (
        <PropertyForm mode="create" />
      ) : (
        <PlanLimitNotice
          plan={entitlements.plan}
          limit={entitlements.propertyLimit}
        />
      )}
    </div>
  );
}
