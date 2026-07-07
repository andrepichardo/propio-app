/**
 * Domain error hierarchy. Services throw these; the action layer maps them to
 * a typed `ActionResult` so the UI never sees raw stack traces.
 */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = 'APP_ERROR', statusCode = 400) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You must be signed in to do that.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(`${entity} not found.`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = 'The submitted data is invalid.',
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, 'VALIDATION_ERROR', 422);
    this.fieldErrors = fieldErrors;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'This action conflicts with existing data.') {
    super(message, 'CONFLICT', 409);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
