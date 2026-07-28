import { Skeleton } from '@/shared/components/ui/skeleton';
import { ReportsDataSkeleton } from '@/features/reports/components/reports-skeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header: title + description on the left, year selector on the right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <ReportsDataSkeleton />
    </div>
  );
}
