import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { statementFiltersSchema } from '@/features/statements/validators/statement.validators';
import { StatementsList } from '@/features/statements/components/statements-list';
import { GenerateStatementDialog } from '@/features/statements/components/generate-statement-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('statements') };
}

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

  const t = await getTranslations('statements');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
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
