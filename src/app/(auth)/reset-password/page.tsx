import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invalid reset link
        </h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is missing information or has expired.
        </p>
        <Button asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password you don’t use elsewhere
        </p>
      </div>
      <ResetPasswordForm token={token} email={email} />
    </div>
  );
}
