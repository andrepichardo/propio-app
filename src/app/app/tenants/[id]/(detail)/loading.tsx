import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

/** Mirrors the tenant detail layout (mobile-first) so the load doesn't jump. */
export default function TenantDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header: name + summary, single edit action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Profile card: avatar, name/contact, stat tiles, member-since */}
        <Card className="flex flex-col">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="flex flex-1 flex-col items-center gap-4">
              <div className="relative">
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="absolute -bottom-1 -right-1 size-7 rounded-full" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40 max-w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 border-t pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-3 w-40 max-w-full" />
          </CardContent>
        </Card>

        {/* Contact info + emergency contact cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
