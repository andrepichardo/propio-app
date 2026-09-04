'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { deletePaymentAction } from '../actions/payment.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

/**
 * Confirmed rather than one-click: this permanently deletes the payment, its
 * receipt and both PDFs, and shifts reported income. There is no undo.
 *
 * `receiptNumber` is named in the confirmation because deleting frees it: the
 * next receipt takes it back (the sequence is the MAX in use, and this is a
 * hard delete). Harmless when re-registering the same payment, which is the
 * intended use — but a tenant who already has that receipt ends up holding a
 * number that belongs to a different payment, and only the owner knows whether
 * it was delivered.
 */
export function DeletePaymentDialog({
  paymentId,
  receiptNumber,
}: {
  paymentId: string;
  receiptNumber?: string | null;
}) {
  const t = useTranslations('payments.delete');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePaymentAction({ id: paymentId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('deletedToast'));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={t('trigger')}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {receiptNumber ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            {t('receiptReuse', { number: receiptNumber })}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t('keep')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isPending}
          >
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
