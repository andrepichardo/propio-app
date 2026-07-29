import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';

/** One field: label + input (+ optional hint), matching the settings forms. */
function FieldSkeleton({ hint = false }: { hint?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-full" />
      {hint ? <Skeleton className="h-3 w-24 max-w-full" /> : null}
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      {/* Preferences form: "Formato" + "Recordatorios" cards, one save button */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <div className="sm:max-w-xs">
              <FieldSkeleton hint />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 max-w-full" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
                <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Security form: "Seguridad" card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSkeleton />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
