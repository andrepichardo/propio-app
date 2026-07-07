'use server';

import { prisma } from '@/shared/lib/prisma';
import { createOwnerQueryAction } from '@/shared/lib/action';
import { issueVerificationEmail } from '../services/email-verification.service';

export const resendVerificationEmailAction = createOwnerQueryAction(
  async ({ ownerId }) => {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { email: true, emailVerified: true },
    });
    if (!user || user.emailVerified) return { sent: false };

    await issueVerificationEmail(user.email);
    return { sent: true };
  },
);
