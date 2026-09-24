'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { openBillingPortalAction } from '../actions/billing.actions';

/** Portal links are single-use and short-lived, so one is minted per click rather than rendered into the page. */
export function ManageSubscriptionButton() {
  const t = useTranslations('billing');
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      const result = await openBillingPortalAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  return (
    <Button variant="outline" onClick={openPortal} loading={isPending}>
      {t('manage')} <ExternalLink className="size-4" />
    </Button>
  );
}
