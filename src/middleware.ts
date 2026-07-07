import NextAuth from 'next-auth';
import { authConfig } from '@/shared/lib/auth/auth.config';

/**
 * Edge middleware for route protection. It only uses the edge-safe base config
 * (no Prisma/bcrypt), reading the JWT to decide whether `/app/**` is allowed.
 * Actual credential verification happens in the Node route handler.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets, image optimizer, and API auth.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
