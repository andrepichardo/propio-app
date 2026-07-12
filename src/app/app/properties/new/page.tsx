import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/shared/components/page-header';
import { PropertyForm } from '@/features/properties/components/property-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('newProperty') };
}

export default async function NewPropertyPage() {
  const t = await getTranslations('properties.new');
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <PropertyForm mode="create" />
    </div>
  );
}
