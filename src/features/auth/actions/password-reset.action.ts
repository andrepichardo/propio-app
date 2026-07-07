'use server';

import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/shared/lib/prisma';
import { hashPassword } from '@/shared/lib/auth/password';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/shared/lib/auth/auth.validators';
import { clientEnv } from '@/shared/config/env';
import { AppError, ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { sendResetPasswordEmail } from '@/emails/send';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const IDENTIFIER_PREFIX = 'password-reset:';

/** Store only a hash of the token so a DB leak can't be used to reset. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Begin a password reset. Always returns success — never reveal whether an
 * email is registered (prevents account enumeration).
 */
export async function forgotPasswordAction(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  try {
    const parsed = forgotPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Enter a valid email address.', {
        email: ['Enter a valid email address.'],
      });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.hashedPassword) {
      const token = randomBytes(32).toString('hex');
      const identifier = `${IDENTIFIER_PREFIX}${email}`;

      // Invalidate any previous outstanding tokens for this user.
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      await prisma.verificationToken.create({
        data: {
          identifier,
          token: hashToken(token),
          expires: new Date(Date.now() + RESET_TTL_MS),
        },
      });

      const resetUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await sendResetPasswordEmail({ to: email, resetUrl });
    }

    return ok({ sent: true });
  } catch (error) {
    return toActionFailure(error);
  }
}

/** Complete a password reset using a valid, unexpired token. */
export async function resetPasswordAction(
  input: unknown & { email?: string },
): Promise<ActionResult<{ reset: true }>> {
  try {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Please correct the highlighted fields.',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const email = String(input.email ?? '').toLowerCase();
    const identifier = `${IDENTIFIER_PREFIX}${email}`;
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token: hashToken(parsed.data.token),
        },
      },
    });

    if (!record || record.expires < new Date()) {
      throw new AppError(
        'This reset link is invalid or has expired.',
        'INVALID_TOKEN',
        400,
      );
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { hashedPassword } }),
      prisma.verificationToken.deleteMany({ where: { identifier } }),
    ]);

    return ok({ reset: true });
  } catch (error) {
    return toActionFailure(error);
  }
}
