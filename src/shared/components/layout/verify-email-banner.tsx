'use client';

import { useState, useTransition } from 'react';
import { MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { resendVerificationEmailAction } from '@/features/auth/actions/resend-verification.action';

/**
 * Soft enforcement of email verification: credential accounts see a dismissable
 * prompt until they confirm their address. We never hard-block the app.
 */
export function VerifyEmailBanner() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function resend() {
    startTransition(async () => {
      const result = await resendVerificationEmailAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success('Verification email sent. Check your inbox.');
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-warning/10 px-4 py-2.5 text-sm sm:px-6">
      <p className="flex items-center gap-2 text-foreground/90">
        <MailWarning className="size-4 shrink-0 text-warning" />
        Please verify your email address to secure your account.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={resend}
        loading={isPending}
        disabled={sent}
      >
        {sent ? 'Email sent' : 'Resend link'}
      </Button>
    </div>
  );
}
