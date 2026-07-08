import { type NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/features/auth/services/email-verification.service';

export const dynamic = 'force-dynamic';

/**
 * Email verification landing. The user follows this link from their inbox and
 * has no session yet, so we land on /login with an explicit outcome flag the
 * page can turn into a clear "verified — sign in" or "link expired" notice.
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
    new URL(
      verified
        ? '/login?verified=1'
        : `/login?error=verification&email=${encodeURIComponent(email)}`,
      request.url,
    ),
  );
}
