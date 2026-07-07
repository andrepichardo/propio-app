import { describe, expect, it } from 'vitest';
import { fail, ok, toActionFailure } from '@/shared/lib/result';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/lib/errors';

describe('ok / fail', () => {
  it('builds a success result', () => {
    expect(ok({ id: '1' })).toEqual({ success: true, data: { id: '1' } });
  });

  it('builds a failure result', () => {
    expect(fail('Nope', 'CUSTOM')).toEqual({
      success: false,
      error: 'Nope',
      code: 'CUSTOM',
      fieldErrors: undefined,
    });
  });
});

describe('toActionFailure', () => {
  it('preserves domain error messages and codes', () => {
    const failure = toActionFailure(new NotFoundError('Property'));
    expect(failure.success).toBe(false);
    expect(failure.code).toBe('NOT_FOUND');
    expect(failure.error).toBe('Property not found.');
  });

  it('carries field-level errors from ValidationError', () => {
    const failure = toActionFailure(
      new ValidationError('Invalid.', { name: ['Required.'] }),
    );
    expect(failure.code).toBe('VALIDATION_ERROR');
    expect(failure.fieldErrors).toEqual({ name: ['Required.'] });
  });

  it('maps auth and conflict errors to their codes', () => {
    expect(toActionFailure(new UnauthorizedError()).code).toBe('UNAUTHORIZED');
    expect(toActionFailure(new ConflictError()).code).toBe('CONFLICT');
  });

  it('never leaks unknown error internals to the client', () => {
    const failure = toActionFailure(new Error('secret stack detail'));
    expect(failure.code).toBe('INTERNAL_ERROR');
    expect(failure.error).not.toContain('secret');
  });
});
