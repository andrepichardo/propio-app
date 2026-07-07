import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyService } from '@/features/properties/services/property.service';
import { documentFiltersSchema } from '@/features/documents/validators/document.validators';
import { DocumentsList } from '@/features/documents/components/documents-list';
import { UploadDocumentDialog } from '@/features/documents/components/upload-document-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Documents' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const [filters, properties] = await Promise.all([
    documentFiltersSchema.parse(await searchParams),
    propertyService.options(ownerId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Contracts, invoices, IDs and photos — organised per property."
        actions={
          <UploadDocumentDialog
            properties={properties.map((p) => ({ id: p.id, label: p.name }))}
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
