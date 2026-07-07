import { type NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/features/auth/services/email-verification.service';

export const dynamic = 'force-dynamic';

/**
 * Email verification landing. Route handlers bypass layouts, so this works
 * whether or not the user is signed in; we redirect into the app afterwards
 * (middleware bounces unauthenticated users to /login).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const verified = await verifyEmailToken(email, token);
  return NextResponse.redirect(
    new URL(verified ? '/app' : '/login?error=verification', request.url),
  );
}
