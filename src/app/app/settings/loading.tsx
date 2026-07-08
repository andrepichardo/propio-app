import { Skeleton } from '@/shared/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
