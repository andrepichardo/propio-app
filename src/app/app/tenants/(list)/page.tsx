import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { tenantFiltersSchema } from '@/features/tenants/validators/tenant.validators';
import { TenantsList } from '@/features/tenants/components/tenants-list';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('tenants') };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const filters = tenantFiltersSchema.parse(await searchParams);
  const t = await getTranslations('tenants');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <Button asChild>
            <Link href="/app/tenants/new">
              <Plus className="size-4" /> {t('add')}
            </Link>
          </Button>
        }
      />
      <SearchInput placeholder={t('searchPlaceholder')} className="max-w-sm" />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <TenantsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
