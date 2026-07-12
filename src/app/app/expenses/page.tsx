import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyService } from '@/features/properties/services/property.service';
import { expenseFiltersSchema } from '@/features/expenses/validators/expense.validators';
import { ExpensesList } from '@/features/expenses/components/expenses-list';
import { ExpenseCategoryFilter } from '@/features/expenses/components/expense-category-filter';
import { CreateExpenseDialog } from '@/features/expenses/components/create-expense-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('expenses') };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const [filters, properties] = await Promise.all([
    expenseFiltersSchema.parse(await searchParams),
    propertyService.options(ownerId),
  ]);

  const propertyOptions = properties.map((p) => ({
    id: p.id,
    label: p.name,
  }));
  const t = await getTranslations('expenses');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={<CreateExpenseDialog properties={propertyOptions} />}
      />
      <ExpenseCategoryFilter />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <ExpensesList
          ownerId={ownerId}
          filters={filters}
          properties={propertyOptions}
        />
      </Suspense>
    </div>
  );
}
