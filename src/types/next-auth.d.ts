import type { DefaultSession } from 'next-auth';

/**
 * Augment Auth.js types so `session.user.id` / `role` are strongly typed
 * everywhere instead of `any`.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}
