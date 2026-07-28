'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { addYears } from 'date-fns';
import {
  renewContractSchema,
  type RenewContractInput,
} from '../validators/contract.validators';
import { renewContractAction } from '../actions/contract.actions';
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

const QUICK_INCREASES = [0, 5, 10, 15];

/** Round to cents so a percentage bump never produces float noise. */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function RenewContractDialog({
  contractId,
  currentRent,
  currency,
  previousEndDate,
  className,
}: {
  contractId: string;
  currentRent: number;
  currency: string;
  previousEndDate: Date | null;
  className?: string;
}) {
  const t = useTranslations('contracts.renew');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // The new term picks up where the old one ended (or today for open-ended).
  const defaultStart = previousEndDate ?? new Date();

  const form = useForm<RenewContractInput>({
    resolver: zodResolver(renewContractSchema),
    defaultValues: {
      contractId,
      startDate: defaultStart,
      endDate: addYears(defaultStart, 1),
      monthlyRent: currentRent,
      notes: '',
    },
  });

  const newRent = Number(form.watch('monthlyRent')) || 0;
  // The amount is the source of truth; the percentage is a two-way readout so
  // a negotiated figure and a clean percentage bump are equally first-class.
  const impliedPct =
    currentRent > 0 ? ((newRent - currentRent) / currentRent) * 100 : 0;

  function applyIncrease(pct: number) {
    form.setValue('monthlyRent', roundMoney(currentRent * (1 + pct / 100)), {
      shouldValidate: true,
    });
  }

  function onSubmit(values: RenewContractInput) {
    startTransition(async () => {
      const result = await renewContractAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('renewedToast'));
      setOpen(false);
      router.push(`/app/contracts/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <RefreshCw className="size-4" /> {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">{t('currentRent')}</span>
              <span className="font-semibold">
                {formatCurrency(currentRent, currency)}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t('increase')}</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_INCREASES.map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyIncrease(pct)}
                  >
                    {pct === 0 ? t('noIncrease') : `+${pct}%`}
                  </Button>
                ))}
              </div>
              <FormDescription>{t('increaseHint')}</FormDescription>
            </div>

            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t('newRent')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    {newRent > 0 && currentRent > 0
                      ? impliedPct === 0
                        ? t('sameRent')
                        : t('impliedChange', {
                            pct: impliedPct.toFixed(1),
                          })
                      : null}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('startDate')}</FormLabel>
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
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('endDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInputValue(field.value) : ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormDescription>{t('endDateHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              {t('depositNote')}
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
