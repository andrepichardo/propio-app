import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';

/** Mirrors the contract detail layout (mobile-first) so the load doesn't jump. */
export default function ContractDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header: title + description, then actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 max-w-full" />
          <Skeleton className="h-4 w-44 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          {/* Primary CTA (full width on mobile) */}
          <Skeleton className="h-9 w-full sm:w-36" />
          {/* Secondary actions: 3 equal buttons on mobile, inline on desktop */}
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
        <Skeleton className="h-4 w-36 max-w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Terms card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Deposit card — header (button top-right on desktop), amount row,
              note, bottom CTA on mobile */}
          <Card className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 max-w-full" />
                <Skeleton className="h-4 w-52 max-w-full" />
              </div>
              <Skeleton className="hidden h-9 w-36 shrink-0 sm:block" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-full max-w-xs" />
              <Skeleton className="mt-2 h-9 w-full sm:hidden" />
            </CardContent>
          </Card>

          {/* Signed contract card — text + upload button */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36 max-w-full" />
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 min-w-0 flex-1" />
              <Skeleton className="h-8 w-24 shrink-0" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
