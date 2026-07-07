import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { statementFiltersSchema } from '@/features/statements/validators/statement.validators';
import { StatementsList } from '@/features/statements/components/statements-list';
import { GenerateStatementDialog } from '@/features/statements/components/generate-statement-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Statements' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const [filters, contracts] = await Promise.all([
    statementFiltersSchema.parse(await searchParams),
    contractRepository.activeOptions(ownerId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statements"
        description="Monthly summaries of charges, payments and balances per contract."
        actions={
          <GenerateStatementDialog
            contracts={contracts.map((c) => ({
              id: c.id,
              label: `${c.property.name} · ${c.tenant.firstName} ${c.tenant.lastName}`,
            }))}
          />
        }
      />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <StatementsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
