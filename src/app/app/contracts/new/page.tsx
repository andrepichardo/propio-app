import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { propertyService } from '@/features/properties/services/property.service';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { ContractForm } from '@/features/contracts/components/contract-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('newContract') };
}

export default async function NewContractPage() {
  const ownerId = await requireOwnerId();
  const [properties, tenants, prefs] = await Promise.all([
    propertyService.options(ownerId),
    tenantService.options(ownerId),
    getUserPreferences(ownerId),
  ]);

  const t = await getTranslations('contracts.new');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <ContractForm
        mode="create"
        properties={properties.map((p) => ({ id: p.id, label: p.name }))}
        tenants={tenants.map((t) => ({
          id: t.id,
          label: `${t.firstName} ${t.lastName}`,
        }))}
        defaultValues={{ currency: prefs.currency }}
      />
    </div>
  );
}
