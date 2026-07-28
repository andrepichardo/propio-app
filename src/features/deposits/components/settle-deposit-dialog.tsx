'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { HandCoins } from 'lucide-react';
import {
  settleDepositSchema,
  type SettleDepositInput,
} from '../validators/deposit.validators';
import { settleDepositAction } from '../actions/deposit.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import { formatCurrency, toDateInputValue } from '@/shared/lib/format';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';

export function SettleDepositDialog({
  contractId,
  held,
  currency,
  className,
}: {
  contractId: string;
  held: number;
  currency: string;
  className?: string;
}) {
  const t = useTranslations('deposits');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettleDepositInput>({
    resolver: zodResolver(settleDepositSchema),
    defaultValues: {
      contractId,
      amountRetained: 0,
      reason: '',
      settledAt: new Date(),
    },
  });

  // Returned is always derived, never typed, so the parts can't drift apart.
  const retained = Number(form.watch('amountRetained')) || 0;
  const returned = Math.max(0, held - retained);
  const exceedsDeposit = retained > held;

  function onSubmit(values: SettleDepositInput) {
    startTransition(async () => {
      const result = await settleDepositAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('settledToast'));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <HandCoins className="size-4" /> {t('settle')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settleTitle')}</DialogTitle>
          <DialogDescription>{t('settleDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">{t('collected')}</span>
              <span className="font-semibold">
                {formatCurrency(held, currency)}
              </span>
            </div>

            <FormField
              control={form.control}
              name="amountRetained"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('retained')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={held}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('retainedHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                exceedsDeposit ? 'border-destructive' : ''
              }`}
            >
              <span className="text-muted-foreground">{t('toReturn')}</span>
              <span
                className={`font-semibold ${
                  exceedsDeposit ? 'text-destructive' : ''
                }`}
              >
                {exceedsDeposit
                  ? t('exceedsDeposit')
                  : formatCurrency(returned, currency)}
              </span>
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('reason')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t('reasonPlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t('settledAt')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={exceedsDeposit}
              >
                {t('confirmSettle')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
