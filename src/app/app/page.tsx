import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { PageHeader } from '@/shared/components/page-header';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('dashboard') };
}

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { currency } = await getUserPreferences(user.id);
  const t = await getTranslations('dashboard');
  const firstName = user.name?.split(' ')[0];
  const greeting = t(greetingKey());
  const title = firstName
    ? t('greetingName', { greeting, name: firstName })
    : greeting;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={t('subtitle')} />

      <QuickActions />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview ownerId={user.id} currency={currency} />
      </Suspense>
    </div>
  );
}
