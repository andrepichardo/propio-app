'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { resendVerificationPublicAction } from '../actions/resend-verification-public.action';

/** Mirrors the server-side per-email cooldown so the UI never invites a
 * request the server would silently skip. */
const COOLDOWN_SECONDS = 60;

/** Generic message shown regardless of outcome, to avoid account enumeration. */
const GENERIC_MESSAGE =
  "If an unverified account exists for that email, we've sent a new link.";

export function ResendVerificationForm({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const knownEmail = Boolean(initialEmail);
  const [email, setEmail] = useState(initialEmail ?? '');
  // Arriving from registration means a verification email was just issued, so
  // the resend button starts on cooldown instead of tempting an instant retry.
  const [secondsLeft, setSecondsLeft] = useState(
    knownEmail ? COOLDOWN_SECONDS : 0,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function onResend() {
    startTransition(async () => {
      const result = await resendVerificationPublicAction({ email });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(GENERIC_MESSAGE);
      setSecondsLeft(COOLDOWN_SECONDS);
    });
  }

  const coolingDown = secondsLeft > 0;

  return (
    <div className="w-full space-y-2">
      {!knownEmail && (
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      )}
      <Button
        variant="outline"
        className="w-full"
        onClick={onResend}
        loading={isPending}
        disabled={coolingDown || email.trim().length === 0}
      >
        {coolingDown
          ? `Resend available in ${secondsLeft}s`
          : 'Resend verification email'}
      </Button>
    </div>
  );
}
