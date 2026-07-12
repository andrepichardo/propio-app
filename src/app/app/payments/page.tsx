import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { paymentFiltersSchema } from '@/features/payments/validators/payment.validators';
import { PaymentsList } from '@/features/payments/components/payments-list';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('payments') };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ownerId = await requireOwnerId();
  const filters = paymentFiltersSchema.parse(await searchParams);
  const t = await getTranslations('payments');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <Button asChild>
            <Link href="/app/payments/new">
              <Plus className="size-4" /> {t('add')}
            </Link>
          </Button>
        }
      />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-72 rounded-xl" />}
      >
        <PaymentsList ownerId={ownerId} filters={filters} />
      </Suspense>
    </div>
  );
}
