'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/shared/lib/auth/auth';
import { loginSchema } from '@/shared/lib/auth/auth.validators';
import { ValidationError } from '@/shared/lib/errors';
import { type ActionResult, fail, ok, toActionFailure } from '@/shared/lib/result';

/**
 * Authenticate with email + password via the Credentials provider.
 * Returns a typed result so the form can show inline errors; the client
 * performs the redirect on success (keeps this a pure action).
 */
export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Please correct the highlighted fields.',
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    return ok({ redirectTo: '/app' });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        if ('code' in error && error.code === 'email_not_verified') {
          return fail(
            'Please verify your email before signing in. Check your inbox for the verification link.',
            'EMAIL_NOT_VERIFIED',
          );
        }
        return fail('Invalid email or password.', 'INVALID_CREDENTIALS');
      }
      return fail('Could not sign you in. Please try again.', 'AUTH_ERROR');
    }
    return toActionFailure(error);
  }
}

/** Start an OAuth flow. Throws a redirect handled by Next.js. */
export async function oauthSignInAction(
  provider: 'google' | 'github',
): Promise<void> {
  await signIn(provider, { redirectTo: '/app' });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
