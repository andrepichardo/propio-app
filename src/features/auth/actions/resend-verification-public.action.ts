'use server';

import { prisma } from '@/shared/lib/prisma';
import { forgotPasswordSchema } from '@/shared/lib/auth/auth.validators';
import { ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
import { reissueVerificationEmail } from '../services/email-verification.service';

/**
 * Public (unauthenticated) "resend verification email".
 *
 * Security: always returns the same generic success — never reveals whether the
 * email exists, is already verified, or is OAuth-only (prevents account
 * enumeration). Sending is throttled per address in `reissueVerificationEmail`.
 */
export async function resendVerificationPublicAction(
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
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, hashedPassword: true },
    });

    // Only act for a real, still-unverified, credentials account — silently.
    if (user && !user.emailVerified && user.hashedPassword) {
      await reissueVerificationEmail(email);
    }

    return ok({ sent: true });
  } catch (error) {
    return toActionFailure(error);
  }
}
