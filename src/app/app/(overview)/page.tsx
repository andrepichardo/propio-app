import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { WelcomeToast } from '@/features/auth/components/welcome-toast';
import { PageHeader } from '@/shared/components/page-header';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { Greeting } from '@/features/dashboard/components/greeting';
import { greetingKey } from '@/shared/lib/greeting';
import { Skeleton } from '@/shared/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('dashboard') };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      {/* Chart + right column (upcoming payments / deposits stacked) */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[26rem] rounded-xl" />
        <div className="flex flex-col gap-6 lg:grid lg:h-[26rem] lg:grid-rows-2">
          <Skeleton className="h-44 rounded-xl lg:h-auto" />
          <Skeleton className="h-44 rounded-xl lg:h-auto" />
        </div>
      </div>
      {/* Expiring contracts + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[22rem] rounded-xl" />
        <Skeleton className="h-[22rem] rounded-xl" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { currency } = await getUserPreferences(user.id);
  const t = await getTranslations('dashboard');
  const firstName = user.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>

      <PageHeader
        title={
          <Greeting name={firstName} initialKey={greetingKey(new Date())} />
        }
        description={t('subtitle')}
      />

      <QuickActions />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview ownerId={user.id} currency={currency} />
      </Suspense>
    </div>
  );
}
