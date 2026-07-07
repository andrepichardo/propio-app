import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { tenantFiltersSchema } from '@/features/tenants/validators/tenant.validators';
import { TenantsList } from '@/features/tenants/components/tenants-list';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Tenants' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const filters = tenantFiltersSchema.parse(await searchParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Everyone renting across your properties."
        actions={
          <Button asChild>
            <Link href="/app/tenants/new">
              <Plus className="size-4" /> Add tenant
            </Link>
          </Button>
        }
      />
      <SearchInput
        placeholder="Search by name, email or phone…"
        className="max-w-sm"
      />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <TenantsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
