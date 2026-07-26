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

  const t = await getTranslations('documents');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <UploadDocumentDialog
            properties={properties.map((p) => ({ id: p.id, label: p.name }))}
            tenants={tenants.map((t) => ({
              id: t.id,
              label: `${t.firstName} ${t.lastName}`,
            }))}
          />
        }
      />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <DocumentsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
