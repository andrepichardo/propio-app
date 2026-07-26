import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyService } from '@/features/properties/services/property.service';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { documentFiltersSchema } from '@/features/documents/validators/document.validators';
import { DocumentsList } from '@/features/documents/components/documents-list';
import { UploadDocumentDialog } from '@/features/documents/components/upload-document-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { QueryFilterSelect } from '@/shared/components/query-filter-select';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('documents') };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const [filters, properties, tenants] = await Promise.all([
    documentFiltersSchema.parse(await searchParams),
    propertyService.options(ownerId),
    tenantService.options(ownerId),
  ]);

  const [t, tCommon] = await Promise.all([
    getTranslations('documents'),
    getTranslations('common'),
  ]);

  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name }));
  const tenantOptions = tenants.map((tenant) => ({
    id: tenant.id,
    label: `${tenant.firstName} ${tenant.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <UploadDocumentDialog
            properties={propertyOptions}
            tenants={tenantOptions}
          />
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <QueryFilterSelect
          param="propertyId"
          allLabel={tCommon('allProperties')}
          options={propertyOptions}
        />
        <QueryFilterSelect
          param="tenantId"
          allLabel={tCommon('allTenants')}
          options={tenantOptions}
        />
      </div>
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <DocumentsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
