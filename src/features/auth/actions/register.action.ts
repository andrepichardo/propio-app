'use server';

import { prisma } from '@/shared/lib/prisma';
import { hashPassword } from '@/shared/lib/auth/password';
import { registerSchema } from '@/shared/lib/auth/auth.validators';
import { ConflictError, ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { sendWelcomeEmail } from '@/emails/send';
import { issueVerificationEmail } from '../services/email-verification.service';

/**
 * Create a credentials-based account. Idempotency + safety:
 *  • email is normalised to lowercase (matches the unique index)
 *  • existing email → typed ConflictError (never reveals password state)
 *  • password is hashed with bcrypt before it ever touches the DB
 */
export async function registerAction(
  input: unknown,
): Promise<ActionResult<{ id: string; email: string }>> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Please correct the highlighted fields.',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        hashedPassword,
      },
      select: { id: true, email: true, name: true },
    });

    // Fire-and-forget emails; never block registration on delivery.
    void sendWelcomeEmail({ to: user.email, name: user.name });
    void issueVerificationEmail(user.email);

    return ok({ id: user.id, email: user.email });
  } catch (error) {
    return toActionFailure(error);
  }
}
