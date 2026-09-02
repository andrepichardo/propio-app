import NextAuth, { CredentialsSignin } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/shared/lib/prisma';
import { getUserLocale } from '@/i18n/locale';
import { defaultLocale } from '@/i18n/config';
import { authConfig } from './auth.config';
import { verifyPassword } from './password';
import { credentialsSchema } from './auth.validators';

/**
 * Thrown when credentials are correct but the email hasn't been verified.
 * The `code` lets `loginAction` show a specific "verify your email" message
 * instead of the generic invalid-credentials error.
 */
export class EmailNotVerifiedError extends CredentialsSignin {
  override code = 'email_not_verified';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
      issuer: 'https://github.com/login/oauth',
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });


        if (!user?.hashedPassword) return null;

        const valid = await verifyPassword(password, user.hashedPassword);
        if (!valid) return null;

        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        const locale = await getUserLocale();
        if (locale === defaultLocale) return;
        await prisma.user.update({ where: { id: user.id }, data: { locale } });
      } catch (error) {
        console.error('[auth] could not store the sign-up locale', error);
      }
    },
  },
});
