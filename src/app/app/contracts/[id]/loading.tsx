import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';

/** Mirrors the contract detail layout so the transition doesn't jump. */
export default function ContractDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header: title + description on the left, actions on the right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          <Skeleton className="h-9 w-full sm:w-36" />
          <div className="flex w-full gap-2 sm:contents">
            <Skeleton className="h-9 flex-1 sm:w-28" />
            <Skeleton className="h-9 flex-1 sm:w-24" />
            <Skeleton className="h-9 flex-1 sm:w-28" />
          </div>
        </div>
      </div>

      {/* Status badge + payments count */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Terms card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Deposit card */}
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
              <Skeleton className="h-9 w-36 shrink-0" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-full max-w-xs" />
            </CardContent>
          </Card>

          {/* Signed contract card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-9 w-28 shrink-0" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
