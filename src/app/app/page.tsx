import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUser } from '@/shared/lib/auth/session';
import { getUserPreferences } from '@/shared/lib/auth/preferences';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { PageHeader } from '@/shared/components/page-header';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const metadata: Metadata = { title: 'Dashboard' };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
  const firstName = user.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Here’s what’s happening across your portfolio."
      />

      <QuickActions />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview ownerId={user.id} currency={currency} />
      </Suspense>
    </div>
  );
}
