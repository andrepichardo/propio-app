import 'server-only';
import { cache } from 'react';
import { auth } from './auth';
import { UnauthorizedError } from '@/shared/lib/errors';

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
};

/**
 * Read the current user from the session. Cached per-request so multiple
 * server components / actions in one render don't each hit the session.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role ?? 'OWNER',
  };
});

/**
 * Require an authenticated user. Throws {@link UnauthorizedError} — the action
 * layer converts it to a typed failure, and pages can let it bubble to the
 * nearest error boundary / middleware redirect.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * The single source of truth for the tenant boundary: every repository call is
 * scoped to the id returned here. In this product the owner *is* the user.
 */
export async function requireOwnerId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}
