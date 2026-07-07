import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractFiltersSchema } from '@/features/contracts/validators/contract.validators';
import { ContractsList } from '@/features/contracts/components/contracts-list';
import { ContractStatusFilter } from '@/features/contracts/components/contract-status-filter';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Contracts' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const filters = contractFiltersSchema.parse(await searchParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Leases linking tenants to your properties."
        actions={
          <Button asChild>
            <Link href="/app/contracts/new">
              <Plus className="size-4" /> New contract
            </Link>
          </Button>
        }
      />
      <ContractStatusFilter />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <ContractsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
