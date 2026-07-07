import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth configuration.
 *
 * This module must not import Node-only code (Prisma, bcrypt) because it is
 * consumed by the middleware, which runs on the Edge runtime. Providers that
 * need Node (Credentials) and the database adapter are added in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  providers: [],
  callbacks: {
    /**
     * Route guard used by the middleware. Returning false redirects to the
     * sign-in page; returning true allows the request through.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnApp = nextUrl.pathname.startsWith('/app');
      if (isOnApp) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = 'role' in user ? user.role : 'OWNER';
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'OWNER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
