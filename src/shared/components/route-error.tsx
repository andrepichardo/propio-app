'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/**
 * Reusable error-boundary body. Route `error.tsx` files re-export this as their
 * default so every section gets a consistent, friendly recovery UI.
 */
export function RouteError({
  error,
  reset,
  title,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {title ?? t('somethingWrong')}
        </h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t('errorHint')}
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw className="size-4" /> {t('tryAgain')}
      </Button>
    </div>
  );
}

export default RouteError;
