import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

/** Label + input. */
export function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 max-w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

/** Label + multi-line box (textarea). */
export function TextareaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 max-w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/** Label on the left, toggle on the right (switch row). */
export function SwitchRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <Skeleton className="h-4 w-40 max-w-full" />
      <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
    </div>
  );
}

/** A titled card with a grid of fields and optional extra content below. */
export function FormSectionSkeleton({
  titleWidth = 'w-32',
  cols = 2,
  fields = 4,
  footer,
}: {
  titleWidth?: string;
  cols?: 2 | 3;
  fields?: number;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className={cn('h-5', titleWidth)} />
      </CardHeader>
      <CardContent className="space-y-5">
        {fields > 0 ? (
          <div
            className={cn(
              'grid gap-5',
              cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
            )}
          >
            {Array.from({ length: fields }).map((_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
        ) : null}
        {footer}
      </CardContent>
    </Card>
  );
}

/** Page wrapper: header (title + subtitle), the sections, and a save button. */
export function FormPageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {children}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
