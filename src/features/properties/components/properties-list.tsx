import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Building2, Plus } from 'lucide-react';
import { propertyService } from '../services/property.service';
import type { PropertyFilters } from '../validators/property.validators';
import { PropertyCard } from './property-card';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { PaginationControls } from '@/shared/components/pagination-controls';

/**
 * Server component that fetches and renders the property portfolio. Kept
 * separate from the page so it can live inside its own <Suspense> boundary.
 */
export async function PropertiesList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: PropertyFilters;
}) {
  const { items, page, pageCount, total } = await propertyService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('properties');

  const hasFilters = Boolean(filters.search || filters.type || filters.status);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={hasFilters ? t('emptyFilteredTitle') : t('emptyTitle')}
        description={hasFilters ? t('emptyFilteredDesc') : t('emptyDesc')}
        action={
          hasFilters ? undefined : (
            <Button asChild>
              <Link href="/app/properties/new">
                <Plus className="size-4" /> {t('add')}
              </Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      <PaginationControls page={page} pageCount={pageCount} total={total} />
    </div>
  );
}
