'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PaymentMethod, PaymentType } from '@/generated/prisma/enums';
import { Wallet } from 'lucide-react';
import {
  registerPaymentSchema,
  type RegisterPaymentInput,
} from '../validators/payment.validators';
import {
  MAX_PAYMENT_PROOF_MB,
  PAYMENT_METHOD_VALUES,
  PAYMENT_PROOF_ACCEPT,
} from '../constants';
import {
  registerPaymentAction,
  uploadPaymentProofAction,
} from '../actions/payment.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import { addMonths } from 'date-fns';
import {
  firstUncoveredMonth,
  monthValueToDate,
  periodToMonthValue,
  rentPeriodStart,
} from '@/shared/lib/rent-period';
import { useFormatDate } from '@/shared/components/date-format-provider';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { MonthPicker } from '@/shared/components/ui/month-picker';
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
import { FileDropzone } from '@/shared/components/ui/file-dropzone';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { EmptyState } from '@/shared/components/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export type ContractOption = {
  id: string;
  label: string;
  rent: number;
  dueDay: number;
  currency: string;
  /** `yyyy-MM` periods already settled — drives the default and the warning. */
  coveredPeriods: string[];
};

interface PaymentFormProps {
  contracts: ContractOption[];
  defaultContractId?: string;
}

export function PaymentForm({
  contracts,
  defaultContractId,
}: PaymentFormProps) {
  const t = useTranslations('payments');
  const router = useRouter();
  const formatDate = useFormatDate();
  const [isPending, startTransition] = useTransition();
  const [proofUploading, setProofUploading] = useState(false);
  const [proofName, setProofName] = useState<string | null>(null);
  // Once the owner picks a period by hand, stop moving it under them.
  const [periodPicked, setPeriodPicked] = useState(false);

  const preselected = contracts.find((c) => c.id === defaultContractId);
  const today = new Date();

  const form = useForm<RegisterPaymentInput>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      contractId: defaultContractId ?? '',
      amount: preselected?.rent ?? 0,
      type: PaymentType.RENT,
      method: PaymentMethod.TRANSFER,
      reference: '',
      concept: '',
      paidAt: today,
      periodStart: monthValueToDate(
        firstUncoveredMonth(
          preselected?.coveredPeriods ?? [],
          `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
        ),
      ),
      notes: '',
      proofUrl: '',
      sendReceipt: false,
      settlesPeriod: false,
    },
  });

  const proofUrl = form.watch('proofUrl');
  // Show the "covers the full period" toggle only for a rent payment that's
  // below the contract's rent (otherwise it's already fully covered).
  const watchType = form.watch('type');
  const watchAmount = Number(form.watch('amount')) || 0;
  const watchContractId = form.watch('contractId');
  const watchPeriod = form.watch('periodStart');
  const selectedContract = contracts.find((c) => c.id === watchContractId);
  const selectedRent = selectedContract?.rent ?? 0;
  const showSettles =
    watchType !== PaymentType.DEPOSIT &&
    watchAmount > 0 &&
    watchAmount < selectedRent;
  const isRent = watchType !== PaymentType.DEPOSIT;

  /**
   * Month of the payment date. `DatePicker` hands back `yyyy-MM-dd` while the
   * initial default is a real `Date` for today — Zod coerces both on submit,
   * so the field holds either shape while the form is open.
   */
  function monthOf(paidAt: Date | string): string {
    if (typeof paidAt === 'string') return paidAt.slice(0, 7);
    const month = String(paidAt.getMonth() + 1).padStart(2, '0');
    return `${paidAt.getFullYear()}-${month}`;
  }

  /** Suggest the first month this contract still owes, from `paidAt` forward. */
  function suggestPeriod(
    contract: ContractOption | undefined,
    paidAt: Date | string,
  ) {
    return monthValueToDate(
      firstUncoveredMonth(contract?.coveredPeriods ?? [], monthOf(paidAt)),
    );
  }

  const periodMonth = watchPeriod ? periodToMonthValue(watchPeriod) : '';
  const periodAlreadyCovered = Boolean(
    isRent &&
    periodMonth &&
    selectedContract?.coveredPeriods.includes(periodMonth),
  );
  // "15 oct 2026 – 15 nov 2026" — the range the picked month resolves to once
  // the service anchors it to the contract's due day.
  const periodRange =
    isRent && watchPeriod && selectedContract
      ? (() => {
          const start = rentPeriodStart(watchPeriod, selectedContract.dueDay);
          return `${formatDate(start)} – ${formatDate(addMonths(start, 1))}`;
        })()
      : null;

  /** Upload as soon as a file is picked so registration only carries the URL. */
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
    setProofName(file.name);
  }

  function removeProof() {
    form.setValue('proofUrl', '');
    setProofName(null);
  }

  function onSubmit(values: RegisterPaymentInput) {
    startTransition(async () => {
      const result = await registerPaymentAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('recordedToast', { number: result.data.receiptNumber }));
      router.push('/app/payments');
      router.refresh();
    });
  }

  if (contracts.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={t('noContracts.title')}
        description={t('noContracts.desc')}
        action={
          <Button asChild>
            <Link href="/app/contracts/new">{t('noContracts.create')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.payment')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel required>{t('form.contract')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const c = contracts.find((x) => x.id === value);
                      if (!c) return;
                      form.setValue('amount', c.rent);
                      if (!periodPicked) {
                        form.setValue(
                          'periodStart',
                          suggestPeriod(c, form.getValues('paidAt')),
                        );
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.selectContract')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
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
                  <DatePicker
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      if (!periodPicked && next) {
                        form.setValue(
                          'periodStart',
                          suggestPeriod(selectedContract, next),
                        );
                      }
                    }}
                  />
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
                      onChange={(month) => {
                        setPeriodPicked(true);
                        field.onChange(monthValueToDate(month));
                      }}
                    />
                    {periodAlreadyCovered ? (
                      <p className="text-[0.8rem] text-amber-600 dark:text-amber-500">
                        {t('form.periodCovered')}
                      </p>
                    ) : (
                      <FormDescription>
                        {periodRange ?? t('form.periodHint')}
                      </FormDescription>
                    )}
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
                    <Input
                      placeholder={t('form.referencePlaceholder')}
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
                        ? {
                            name: proofName ?? t('form.proofView'),
                            url: proofUrl,
                          }
                        : null
                    }
                    onSelect={uploadProof}
                    onRemove={removeProof}
                    hint={t('form.proofHint', { mb: MAX_PAYMENT_PROOF_MB })}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sendReceipt"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                  <div>
                    <FormLabel>{t('form.emailReceipt')}</FormLabel>
                    <FormDescription>
                      {t('form.emailReceiptHint')}
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
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            {t('form.cancel')}
          </Button>
          <Button type="submit" loading={isPending} disabled={proofUploading}>
            {t('form.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
