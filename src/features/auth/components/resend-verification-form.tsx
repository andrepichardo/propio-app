'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { resendVerificationPublicAction } from '../actions/resend-verification-public.action';

/** Generic message shown regardless of outcome, to avoid account enumeration. */
const GENERIC_MESSAGE =
  "If an unverified account exists for that email, we've sent a new link.";

export function ResendVerificationForm({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [isPending, startTransition] = useTransition();

  function onResend() {
    startTransition(async () => {
      const result = await resendVerificationPublicAction({ email });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(GENERIC_MESSAGE);
    });
  }

  return (
    <div className="w-full space-y-2">
      <Input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button
        className="w-full"
        onClick={onResend}
        loading={isPending}
        disabled={email.trim().length === 0}
      >
        Resend verification email
      </Button>
    </div>
  );
}
