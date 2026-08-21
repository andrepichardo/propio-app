'use client';

import { useCallback, useTransition } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/shared/lib/result';

/**
 * Push server-side field errors from an `ActionResult` back onto a
 * react-hook-form instance so they render inline under the right inputs.
 */
export function applyFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors?: Record<string, string[]>,
): void {
  if (!fieldErrors) return;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages?.[0];
    if (message) {
      form.setError(field as Path<T>, { type: 'server', message });
    }
  }
}

type RunOptions<T> = {
  onSuccess?: (data: T) => void;
  successMessage?: string;
  errorMessage?: string;
};

/**
 * Wrap a server action call with a pending transition + toast handling.
 * Returns `[run, isPending]`.
 */
export function useServerAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<ActionResult<TResult>>,
) {
  const [isPending, startTransition] = useTransition();

  const run = useCallback(
    (options: RunOptions<TResult>, ...args: TArgs) => {
      startTransition(async () => {
        const result = await action(...args);
        if (result.success) {
          if (options.successMessage) toast.success(options.successMessage);
          options.onSuccess?.(result.data);
        } else {
          toast.error(options.errorMessage ?? result.error);
        }
      });
    },
    [action],
  );

  return [run, isPending] as const;
}
