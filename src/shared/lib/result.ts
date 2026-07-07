import { isAppError } from './errors';

/**
 * Discriminated result returned by every server action. Keeps the client from
 * ever having to try/catch: it pattern-matches on `success`.
 */
export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionFailure = {
  success: false;
  error: string;
  code: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function ok<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function fail(
  error: string,
  code = 'APP_ERROR',
  fieldErrors?: Record<string, string[]>,
): ActionFailure {
  return { success: false, error, code, fieldErrors };
}

/**
 * Normalise any thrown value into an `ActionFailure`. Domain errors keep their
 * code and field-level detail; everything else collapses to a safe generic
 * message so we never leak internals to the client.
 */
export function toActionFailure(error: unknown): ActionFailure {
  if (isAppError(error)) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      fieldErrors:
        'fieldErrors' in error
          ? (error as { fieldErrors: Record<string, string[]> }).fieldErrors
          : undefined,
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[Unhandled action error]', error);
  }

  return {
    success: false,
    error: 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
  };
}
