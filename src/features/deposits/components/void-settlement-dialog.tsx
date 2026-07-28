'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { voidSettlementAction } from '../actions/deposit.actions';
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
import { cn } from '@/shared/lib/utils';

export function VoidSettlementDialog({
  settlementId,
  contractId,
  className,
}: {
  settlementId: string;
  contractId: string;
  className?: string;
}) {
  const t = useTranslations('deposits.void');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleVoid() {
    startTransition(async () => {
      const result = await voidSettlementAction({
        id: settlementId,
        contractId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('voidedToast'));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(className)}>
          <Undo2 className="size-4" /> {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
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
            onClick={handleVoid}
            loading={isPending}
          >
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
