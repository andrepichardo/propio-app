import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Data-area skeleton for the reports page: 4 KPI tiles + the revenue/expense
 * chart next to the category breakdown chart. Shared by the route-level
 * `loading.tsx` and the page's internal Suspense fallback so both match the
 * real layout exactly.
 */
export function ReportsDataSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[22rem] rounded-xl" />
        <Skeleton className="h-[22rem] rounded-xl" />
      </div>
    </div>
  );
}
