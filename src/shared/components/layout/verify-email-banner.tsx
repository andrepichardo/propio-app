'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { resendVerificationEmailAction } from '@/features/auth/actions/resend-verification.action';

/**
 * Soft enforcement of email verification: credential accounts see a dismissable
 * prompt until they confirm their address. We never hard-block the app.
 */
export function VerifyEmailBanner() {
  const t = useTranslations('auth.banner');
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
      toast.success(t('sentToast'));
    });
  }

  return (
    <div className="bg-warning/10 flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm sm:px-6">
      <p className="text-foreground/90 flex items-center gap-2">
        <MailWarning className="text-warning size-4 shrink-0" />
        {t('message')}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={resend}
        loading={isPending}
        disabled={sent}
      >
        {sent ? t('sent') : t('resend')}
      </Button>
    </div>
  );
}
