import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

export const metadata: Metadata = { title: 'Verify your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="size-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We’ve sent you a verification link. Click it to confirm your address
          and secure your account.
        </p>
      </div>
      <ResendVerificationForm initialEmail={email} />
      <p className="text-xs text-muted-foreground">
        Didn’t get it? Check your spam folder or resend above.
      </p>
      <Button variant="outline" asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
