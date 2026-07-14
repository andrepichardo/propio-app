'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Fires the sign-in welcome toast after an OAuth login. Credentials logins
 * toast client-side in the form, but OAuth navigates away to the provider,
 * so the callback lands on `/app?welcome=1` and this strips the flag.
 */
export function WelcomeToast() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || searchParams.get('welcome') !== '1') return;
    fired.current = true;
    toast.success(t('welcomeToast'));
    router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname, t]);

  return null;
}
