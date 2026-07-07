'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { oauthSignInAction } from '../actions/auth.actions';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.85c-3.06.67-3.71-1.47-3.71-1.47-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.98 1.69 2.58 1.2 3.21.92.1-.71.39-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.14-2.95-.11-.28-.5-1.4.11-2.91 0 0 .93-.3 3.05 1.13a10.6 10.6 0 0 1 5.56 0C17.87 4.7 18.8 5 18.8 5c.61 1.51.22 2.63.11 2.91.71.77 1.14 1.75 1.14 2.95 0 4.23-2.58 5.16-5.03 5.43.4.34.75 1.01.75 2.04v3.03c0 .3.2.64.76.53A11 11 0 0 0 12 1Z" />
    </svg>
  );
}

export function OAuthButtons() {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<'google' | 'github' | null>(null);

  function handle(provider: 'google' | 'github') {
    setActive(provider);
    startTransition(async () => {
      try {
        await oauthSignInAction(provider);
      } catch {
        toast.error('Could not start sign in. Please try again.');
        setActive(null);
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        loading={isPending && active === 'google'}
        disabled={isPending}
        onClick={() => handle('google')}
      >
        {(!isPending || active !== 'google') && <GoogleIcon />}
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        loading={isPending && active === 'github'}
        disabled={isPending}
        onClick={() => handle('github')}
      >
        {(!isPending || active !== 'github') && <GitHubIcon />}
        GitHub
      </Button>
    </div>
  );
}
