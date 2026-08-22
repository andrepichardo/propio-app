import NextAuth, { CredentialsSignin } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/shared/lib/prisma';
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

/**
 * Full Auth.js instance (Node runtime). Composes the edge-safe base config
 * with the database adapter and Node-only providers.
 *
 * We deliberately keep a JWT session strategy (required by the Credentials
 * provider) while still using the Prisma adapter so OAuth accounts and users
 * are persisted for a unified account model.
 */
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
      /**
       * Required because this is a GitHub **App** (client id `Ov23li…`), not a
       * classic OAuth App. GitHub Apps append an `iss` parameter to the
       * callback; Auth.js validates it against `provider.issuer`, which the
       * GitHub provider leaves unset, so it falls back to the placeholder
       * "https://authjs.dev" and every callback dies with
       * `unexpected "iss" (issuer) response parameter value` — surfaced to the
       * user as the opaque `Configuration` error. Classic OAuth Apps send no
       * `iss`, which is why the stock config works for them and not here.
       */
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

        // No password set → account is OAuth-only; reject credential login.
        if (!user?.hashedPassword) return null;

        const valid = await verifyPassword(password, user.hashedPassword);
        if (!valid) return null;

        // Credentials are correct — now require a verified email. Checked after
        // the password so we never reveal verification state to a guesser.
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
});
