import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';

/** Button row + hint used by the avatar / signature uploaders. */
function UploaderControls() {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-8 w-full max-w-[9rem]" />
      <Skeleton className="h-3 w-full max-w-[12rem]" />
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      {/* Photo card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <UploaderControls />
          </div>
        </CardContent>
      </Card>

      {/* Signature card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-40 shrink-0 rounded-lg" />
            <UploaderControls />
          </div>
        </CardContent>
      </Card>

      {/* Identity card: name + email */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
