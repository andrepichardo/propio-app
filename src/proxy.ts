import NextAuth from 'next-auth';
import { authConfig } from '@/shared/lib/auth/auth.config';

/**
 * Route protection at the network boundary (Next 16 renamed this convention
 * from `middleware` to `proxy`). It reads the JWT to decide whether `/app/**`
 * is allowed; actual credential verification happens in the Node route handler.
 *
 * `proxy` always runs on the Node.js runtime — the edge runtime is not
 * supported here. We still build it from the edge-safe base config (no
 * Prisma/bcrypt) because that split keeps this path lean and dependency-free,
 * not because the runtime forces it.
 */
// Exported as `default` rather than `export const { auth: proxy } = ...`:
// Next statically analyses this file for a function export, and a destructured
// const binding is not recognised as one (the build fails with
// "must export a function").
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except static assets, image optimizer, and API auth.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)'],
};
