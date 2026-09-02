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

    // The language the visitor signed up in becomes the account's. `User.locale`
    // is the ONLY locale receipts, statements and digest emails can see — they
    // render outside a request, where the cookie doesn't exist — so leaving it
    // at the schema default ("en") ships English documents to a Spanish owner.
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

    // Never block registration on delivery, but a plain fire-and-forget dies
    // when Vercel freezes the function after the response — `after()` keeps it
    // alive until the send completes. Only the verification email goes out now
    // — the welcome email is sent after the address is verified (when the
    // account is actually usable).
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
