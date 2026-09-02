'use server';

import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getUserLocale } from '@/i18n/locale';
import { prisma } from '@/shared/lib/prisma';
import { hashPassword } from '@/shared/lib/auth/password';
import { registerSchema } from '@/shared/lib/auth/auth.validators';
import { ConflictError, ValidationError } from '@/shared/lib/errors';
import { type ActionResult, ok, toActionFailure } from '@/shared/lib/result';
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
  const t = await getTranslations('auth.errors');
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        t('fixFields'),
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError(t('emailExists'));
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    const locale = await getUserLocale();

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        hashedPassword,
        locale,
      },
      select: { id: true, email: true, name: true },
    });

    after(async () => {
      try {
        await issueVerificationEmail(user.email, locale);
      } catch (error) {
        console.error('[email] failed to send verification email', error);
      }
    });

    return ok({ id: user.id, email: user.email });
  } catch (error) {
    return toActionFailure(error);
  }
}
