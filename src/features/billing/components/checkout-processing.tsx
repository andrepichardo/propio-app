'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

const POLL_MS = 3000;
const MAX_POLLS = 10;

/**
 * Shown after Paddle redirects back from a successful checkout but before its
 * webhook has written the subscription. Re-renders the page until the plan
 * shows up — the page stops mounting this once it does — and owns up after
 * ~30s instead of spinning forever.
 */
export function CheckoutProcessing({ email }: { email: string }) {
  const t = useTranslations('billing');
  const router = useRouter();
  const [polls, setPolls] = useState(0);
  const gaveUp = polls >= MAX_POLLS;

  useEffect(() => {
    if (gaveUp) return;
    const timer = setTimeout(() => {
      router.refresh();
      setPolls((count) => count + 1);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [polls, gaveUp, router]);

  return (
    <div
      role="status"
      className="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4 text-sm"
    >
      {gaveUp ? null : (
        <Loader2 className="text-primary mt-0.5 size-4 shrink-0 animate-spin" />
      )}
      <p>{gaveUp ? t('processingSlow', { email }) : t('processing')}</p>
    </div>
  );
}
