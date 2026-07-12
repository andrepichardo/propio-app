import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/shared/components/page-header';
import { TenantForm } from '@/features/tenants/components/tenant-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('newTenant') };
}

export default async function NewTenantPage() {
  const t = await getTranslations('tenants.new');
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <TenantForm mode="create" />
    </div>
  );
}
