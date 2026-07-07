import 'server-only';
import type { z } from 'zod';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { ValidationError } from '@/shared/lib/errors';
import {
  type ActionResult,
  ok,
  toActionFailure,
} from '@/shared/lib/result';

type OwnerContext = { ownerId: string };

/**
 * Build an owner-scoped, input-validated server action.
 *
 * Handles the three things every mutation needs — authentication, Zod
 * validation, and error→ActionResult mapping — so individual actions stay
 * focused on business intent.
 *
 * @example
 * export const createProperty = createOwnerAction(
 *   createPropertySchema,
 *   (input, { ownerId }) => propertyService.create(ownerId, input),
 * );
 */
export function createOwnerAction<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  handler: (
    input: z.infer<TSchema>,
    ctx: OwnerContext,
  ) => Promise<TResult>,
): (input: z.input<TSchema>) => Promise<ActionResult<TResult>> {
  return async (input) => {
    try {
      const ownerId = await requireOwnerId();

      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        throw new ValidationError(
          'Please correct the highlighted fields.',
          parsed.error.flatten().fieldErrors as Record<string, string[]>,
        );
      }

      const result = await handler(parsed.data, { ownerId });
      return ok(result);
    } catch (error) {
      return toActionFailure(error);
    }
  };
}

/** Owner-scoped action with no input payload. */
export function createOwnerQueryAction<TResult>(
  handler: (ctx: OwnerContext) => Promise<TResult>,
): () => Promise<ActionResult<TResult>> {
  return async () => {
    try {
      const ownerId = await requireOwnerId();
      return ok(await handler({ ownerId }));
    } catch (error) {
      return toActionFailure(error);
    }
  };
}
