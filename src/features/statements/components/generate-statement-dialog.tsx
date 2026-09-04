'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FilePlus2 } from 'lucide-react';
import { generateStatementAction } from '../actions/statement.actions';
import { Button } from '@/shared/components/ui/button';
import { MonthPicker } from '@/shared/components/ui/month-picker';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export type StatementContractOption = { id: string; label: string };

export function GenerateStatementDialog({
  contracts,
}: {
  contracts: StatementContractOption[];
}) {
  const t = useTranslations('statements');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [contractId, setContractId] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contractId) {
      toast.error(t('selectContractError'));
      return;
    }
    startTransition(async () => {
      const result = await generateStatementAction({
        contractId,
        // "yyyy-MM" → the first of that month at UTC midnight. The `Z` is
        // load-bearing: without it the string parses in the VIEWER's zone, and
        // east of UTC that lands on the last day of the previous month.
        month: new Date(`${month}-01T00:00:00Z`),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('generatedToast', { number: result.data.number }));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={contracts.length === 0}>
          <FilePlus2 className="size-4" /> {t('generate')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('dialog.contract')}</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.selectContract')} />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statement-month">{t('dialog.month')}</Label>
            <MonthPicker
              id="statement-month"
              value={month}
              onChange={setMonth}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('dialog.cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {t('dialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
