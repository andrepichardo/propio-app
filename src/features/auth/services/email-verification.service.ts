import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/shared/lib/prisma';
import { clientEnv } from '@/shared/config/env';
import { sendVerifyEmail } from '@/emails/send';

const IDENTIFIER_PREFIX = 'email-verify:';
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Store only a hash so a DB leak can't be used to verify accounts. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Issue (or re-issue) a verification token for an email and send the link.
 * Previous outstanding tokens are invalidated. Safe to fire-and-forget.
 */
export async function issueVerificationEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const identifier = `${IDENTIFIER_PREFIX}${normalized}`;
  const token = randomBytes(32).toString('hex');

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(token),
      expires: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  const verifyUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}&email=${encodeURIComponent(normalized)}`;
  await sendVerifyEmail({ to: normalized, verifyUrl });
}

/**
 * Consume a verification token. Returns true when the email was verified
 * (idempotent: an already-verified user with a valid token also succeeds).
 */
export async function verifyEmailToken(
  email: string,
  token: string,
): Promise<boolean> {
  const normalized = email.toLowerCase();
  const identifier = `${IDENTIFIER_PREFIX}${normalized}`;

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: hashToken(token) } },
  });
  if (!record || record.expires < new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { email: normalized },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return true;
}
