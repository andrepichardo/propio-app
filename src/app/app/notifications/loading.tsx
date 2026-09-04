import { Skeleton } from '@/shared/components/ui/skeleton';

/** Mirrors the notifications page: header → "mark all read" → icon+text rows. */
export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <div className="space-y-4">
        {/* Mark all as read */}
        <div className="flex justify-end">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Notification list */}
        <ul className="bg-card shadow-soft divide-y rounded-xl border">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="mt-0.5 size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-64 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
