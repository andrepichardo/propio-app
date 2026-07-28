import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Route-level skeleton for the dashboard. Scoped to the `(overview)` group so it
 * never leaks as a fallback for the other `/app` routes. Mirrors the real page:
 * header → quick actions → KPI tiles → chart + side column → bottom cards.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[6.5rem] rounded-xl" />
        ))}
      </div>

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
