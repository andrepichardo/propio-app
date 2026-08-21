'use server';

import { AuthError } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { signIn, signOut } from '@/shared/lib/auth/auth';
import { loginSchema } from '@/shared/lib/auth/auth.validators';
import { ValidationError } from '@/shared/lib/errors';
import {
  type ActionResult,
  fail,
  ok,
  toActionFailure,
} from '@/shared/lib/result';

/**
 * Authenticate with email + password via the Credentials provider.
 * Returns a typed result so the form can show inline errors; the client
 * performs the redirect on success (keeps this a pure action).
 */
export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const t = await getTranslations('auth.errors');
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        t('fixFields'),
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
          return fail(t('emailNotVerified'), 'EMAIL_NOT_VERIFIED');
        }
        return fail(t('invalidCredentials'), 'INVALID_CREDENTIALS');
      }
      return fail(t('authError'), 'AUTH_ERROR');
    }
    return toActionFailure(error);
  }
}

/**
 * Start an OAuth flow.
 *
 * `redirect: false` makes Auth.js RETURN the provider's authorize URL instead
 * of redirecting by throwing. That matters: a thrown redirect crossing the
 * server-action boundary reaches the client as a rejected promise, so any
 * `catch` around the call swallows it and reports a failure that never
 * happened — while the browser navigates to the provider anyway. Returning the
 * URL and letting the client navigate keeps this a pure action, exactly like
 * {@link loginAction}.
 */
export async function oauthSignInAction(
  provider: 'google' | 'github',
): Promise<ActionResult<{ redirectTo: string }>> {
  const t = await getTranslations('auth.errors');
  try {
    // `welcome=1` lets the dashboard fire the sign-in toast post-redirect.
    const url = await signIn(provider, {
      redirectTo: '/app?welcome=1',
      redirect: false,
    });

    if (typeof url !== 'string' || url.length === 0) {
      return fail(t('authError'), 'AUTH_ERROR');
    }
    return ok({ redirectTo: url });
  } catch (error) {
    if (error instanceof AuthError) return fail(t('authError'), 'AUTH_ERROR');
    return toActionFailure(error);
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
