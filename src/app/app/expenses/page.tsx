import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { propertyService } from '@/features/properties/services/property.service';
import { expenseFiltersSchema } from '@/features/expenses/validators/expense.validators';
import { ExpensesList } from '@/features/expenses/components/expenses-list';
import { ExpenseCategoryFilter } from '@/features/expenses/components/expense-category-filter';
import { CreateExpenseDialog } from '@/features/expenses/components/create-expense-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { QueryFilterSelect } from '@/shared/components/query-filter-select';
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
  const [filters, properties, prefs] = await Promise.all([
    expenseFiltersSchema.parse(await searchParams),
    propertyService.options(ownerId),
    getUserPreferences(ownerId),
  ]);

  const propertyOptions = properties.map((p) => ({
    id: p.id,
    label: p.name,
  }));
  const [t, tCommon] = await Promise.all([
    getTranslations('expenses'),
    getTranslations('common'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <CreateExpenseDialog
            properties={propertyOptions}
            defaultCurrency={prefs.currency}
          />
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ExpenseCategoryFilter />
        <QueryFilterSelect
          param="propertyId"
          allLabel={tCommon('allProperties')}
          options={propertyOptions}
        />
      </div>
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
