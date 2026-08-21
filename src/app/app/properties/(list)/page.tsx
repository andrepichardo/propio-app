import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyFiltersSchema } from '@/features/properties/validators/property.validators';
import { PropertiesList } from '@/features/properties/components/properties-list';
import { PropertyFilters } from '@/features/properties/components/property-filters';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('properties') };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const raw = await searchParams;
  // Untrusted query string → validate/coerce before it reaches the service.
  const filters = propertyFiltersSchema.parse(raw);
  const t = await getTranslations('properties');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <Button asChild>
            <Link href="/app/properties/new">
              <Plus className="size-4" /> {t('add')}
            </Link>
          </Button>
        }
      />

      <PropertyFilters />

      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        }
      >
        <PropertiesList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
