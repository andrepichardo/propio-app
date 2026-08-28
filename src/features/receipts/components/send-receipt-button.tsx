'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MailX } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { useServerAction } from '@/shared/hooks/use-server-action';
import { sendReceiptAction } from '../actions/receipt.actions';

/**
 * Row action to (re)send a receipt to its tenant.
 *
 * It confirms first, and the confirmation names the destination address:
 * this sends real mail to a third party, and the owner should see where it is
 * going before it leaves. When the tenant has no email on file there is
 * nothing to confirm, so the control degrades to a muted, explained icon
 * rather than a disabled button nobody can get a tooltip out of.
 */
export function SendReceiptButton({
  id,
  number,
  email,
}: {
  id: string;
  number: string;
  email: string | null;
}) {
  const t = useTranslations('receipts');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [send, isPending] = useServerAction(sendReceiptAction);

  if (!email) {
    return (
      <span
        title={t('noTenantEmail')}
        className="inline-flex size-9 items-center justify-center text-muted-foreground/40"
      >
        <MailX className="size-4" />
        <span className="sr-only">{t('noTenantEmail')}</span>
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('send')}>
          <Mail className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sendTitle')}</DialogTitle>
          <DialogDescription>
            {t('sendDescription', { number, email })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {tc('cancel')}
          </Button>
          <Button
            loading={isPending}
            onClick={() =>
              send(
                {
                  successMessage: t('sendSuccess', { email }),
                  errorMessage: t('sendError'),
                  onSuccess: () => setOpen(false),
                },
                { id },
              )
            }
          >
            {t('sendConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
