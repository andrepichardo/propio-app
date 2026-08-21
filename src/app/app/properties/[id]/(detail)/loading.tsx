import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

/** Mirrors the property detail layout (mobile-first) so the load doesn't jump. */
export default function PropertyDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header: name + type, edit + delete actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 max-w-full" />
          <Skeleton className="h-4 w-32 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Cover image + location/description */}
        <Card className="overflow-hidden">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-2">
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
              <Skeleton className="h-4 min-w-0 flex-1" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5 max-w-full" />
            </div>
            <Skeleton className="h-3 w-40 max-w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Specs */}
          <Card>
            <CardContent className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photos section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-4 w-64 max-w-full" />
          <Skeleton className="mb-5 h-32 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
