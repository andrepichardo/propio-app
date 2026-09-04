'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">This section failed to load</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          We hit an unexpected error. Try again — your data is safe.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw className="size-4" /> Try again
      </Button>
    </div>
  );
}
