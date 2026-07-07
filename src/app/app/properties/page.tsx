import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyFiltersSchema } from '@/features/properties/validators/property.validators';
import { PropertiesList } from '@/features/properties/components/properties-list';
import { PropertyFilters } from '@/features/properties/components/property-filters';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Properties' };

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Your entire portfolio in one place."
        actions={
          <Button asChild>
            <Link href="/app/properties/new">
              <Plus className="size-4" /> Add property
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
