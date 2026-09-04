'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PaymentType, type PaymentMethod } from '@/generated/prisma/enums';
import {
  updatePaymentSchema,
  type UpdatePaymentInput,
} from '../validators/payment.validators';
import {
  MAX_PAYMENT_PROOF_MB,
  PAYMENT_METHOD_VALUES,
  PAYMENT_PROOF_ACCEPT,
} from '../constants';
import {
  updatePaymentAction,
  uploadPaymentProofAction,
} from '../actions/payment.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import {
  monthValueToDate,
  periodToMonthValue,
  rentPeriodEnd,
  rentPeriodStart,
} from '@/shared/lib/rent-period';
import { useFormatDate } from '@/shared/components/date-format-provider';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { MonthPicker } from '@/shared/components/ui/month-picker';
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
import { Switch } from '@/shared/components/ui/switch';
import { FileDropzone } from '@/shared/components/ui/file-dropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export type EditablePayment = {
  id: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  reference?: string | null;
  concept?: string | null;
  notes?: string | null;
  proofUrl?: string | null;
  paidAt: string; // ISO — already serialised by the server component
  /** ISO period this payment settles; null on a deposit or a legacy row. */
  periodStart: string | null;
  settlesPeriod: boolean;
  /** Contract's monthly rent — the "covers full period" toggle only shows when
   * the amount is below it. */
  rent: number;
  /** Day the contract STARTED — what its rent periods are anchored to. */
  anchorDay: number;
  /** `yyyy-MM` bounds of the contract's term; `max` absent = open-ended. */
  periodMin: string;
  periodMax?: string;
};

export function EditPaymentDialog({ payment }: { payment: EditablePayment }) {
  const t = useTranslations('payments');
  const router = useRouter();
  const formatDate = useFormatDate();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [proofUploading, setProofUploading] = useState(false);

  const form = useForm<UpdatePaymentInput>({
    resolver: zodResolver(updatePaymentSchema),
    defaultValues: {
      id: payment.id,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
      reference: payment.reference ?? '',
      concept: payment.concept ?? '',
      notes: payment.notes ?? '',
      proofUrl: payment.proofUrl ?? '',
      paidAt: new Date(payment.paidAt),
      periodStart: payment.periodStart
        ? new Date(payment.periodStart)
        : undefined,
      settlesPeriod: payment.settlesPeriod,
    },
  });

  const proofUrl = form.watch('proofUrl');
  const watchType = form.watch('type');
  const watchAmount = Number(form.watch('amount')) || 0;
  const watchPeriod = form.watch('periodStart');
  const showSettles =
    watchType !== PaymentType.DEPOSIT &&
    watchAmount > 0 &&
    watchAmount < payment.rent;
  const isRent = watchType !== PaymentType.DEPOSIT;

  const periodMonth = watchPeriod ? periodToMonthValue(watchPeriod) : '';
  const periodRange = watchPeriod
    ? (() => {
        const start = rentPeriodStart(watchPeriod, payment.anchorDay);
        return `${formatDate(start)} – ${formatDate(rentPeriodEnd(start))}`;
      })()
    : null;

  async function uploadProof(file: File) {
    const formData = new FormData();
    formData.set('file', file);

    setProofUploading(true);
    const result = await uploadPaymentProofAction(formData);
    setProofUploading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    form.setValue('proofUrl', result.data.url);
  }

  function onSubmit(values: UpdatePaymentInput) {
    startTransition(async () => {
      const result = await updatePaymentAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('updatedToast'));
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
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label={t('editAria')}
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
          <DialogDescription>{t('edit.desc')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                  <div>
                    <FormLabel>{t('form.isDeposit')}</FormLabel>
                    <FormDescription>{t('form.isDepositHint')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === PaymentType.DEPOSIT}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked ? PaymentType.DEPOSIT : PaymentType.RENT,
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t('form.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showSettles ? (
              <FormField
                control={form.control}
                name="settlesPeriod"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                    <div className="pr-3">
                      <FormLabel>{t('form.settlesPeriod')}</FormLabel>
                      <FormDescription>
                        {t('form.settlesPeriodHint')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.method')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHOD_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`methods.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t('form.date')}</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            {isRent ? (
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.period')}</FormLabel>
                    <MonthPicker
                      value={periodMonth}
                      min={payment.periodMin}
                      max={payment.periodMax}
                      onChange={(month) =>
                        field.onChange(monthValueToDate(month))
                      }
                    />
                    <FormDescription>
                      {periodRange ?? t('form.periodHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.reference')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('form.concept')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.conceptPlaceholder')}
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
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proofUrl"
              render={() => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('form.proof')}</FormLabel>
                  <FileDropzone
                    accept={PAYMENT_PROOF_ACCEPT}
                    maxMb={MAX_PAYMENT_PROOF_MB}
                    uploading={proofUploading}
                    disabled={isPending}
                    value={
                      proofUrl
                        ? { name: t('form.proofView'), url: proofUrl }
                        : null
                    }
                    onSelect={uploadProof}
                    onRemove={() => form.setValue('proofUrl', '')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground sm:col-span-2">
              {t('edit.receiptNote')}
            </p>

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t('edit.cancel')}
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={proofUploading}
              >
                {t('edit.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
