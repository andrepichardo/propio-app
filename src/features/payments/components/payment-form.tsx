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
import {
  firstUncoveredMonth,
  monthValueToDate,
  periodToMonthValue,
  rentPeriodEnd,
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
  /** Day of the month the contract STARTED — what its periods run on. */
  anchorDay: number;
  /** Day the rent is due within each period; never anchors a period. */
  dueDay: number;
  currency: string;
  /** `yyyy-MM` periods already settled — drives the default and the block. */
  coveredPeriods: string[];
  /** First `yyyy-MM` the contract's term can be paid for. */
  min: string;
  /** Last one; absent on an open-ended contract. */
  max?: string;
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

  /** Pull a month inside the contract's term. `yyyy-MM` sorts as a string. */
  function clampToTerm(contract: ContractOption | undefined, month: string) {
    if (!contract) return month;
    if (month < contract.min) return contract.min;
    if (contract.max && month > contract.max) return contract.max;
    return month;
  }

  /**
   * Month to preselect: the first one this contract still owes counting from
   * `paidAt`, never outside its term — registering a payment before the
   * contract starts would otherwise default to a month it cannot settle.
   */
  function suggestPeriod(
    contract: ContractOption | undefined,
    paidAt: Date | string,
  ) {
    const from = clampToTerm(contract, monthOf(paidAt));
    const suggestion = firstUncoveredMonth(
      contract?.coveredPeriods ?? [],
      from,
    );
    return monthValueToDate(clampToTerm(contract, suggestion));
  }

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
      periodStart: suggestPeriod(preselected, today),
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

  const periodMonth = watchPeriod ? periodToMonthValue(watchPeriod) : '';
  const periodAlreadyCovered = Boolean(
    isRent &&
    periodMonth &&
    selectedContract?.coveredPeriods.includes(periodMonth),
  );
  // The picker greys these out, so this only catches a month that was already
  // in the field when the contract changed under it.
  const periodOutsideTerm = Boolean(
    isRent &&
    periodMonth &&
    selectedContract &&
    (periodMonth < selectedContract.min ||
      (selectedContract.max !== undefined &&
        periodMonth > selectedContract.max)),
  );
  const periodRejected = periodAlreadyCovered || periodOutsideTerm;
  // "1 may 2026 – 1 jun 2026" — the range the picked month resolves to once the
  // service anchors it to the contract's start day. `rentPeriodEnd`, never
  // `addMonths`: these are UTC-midnight dates and date-fns walks them in local
  // time, which lands a day (or three, across February) short.
  const periodRange =
    isRent && watchPeriod && selectedContract
      ? (() => {
          const start = rentPeriodStart(
            watchPeriod,
            selectedContract.anchorDay,
          );
          return `${formatDate(start)} – ${formatDate(rentPeriodEnd(start))}`;
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
    // A settled month records money that advances nothing (there is no credit
    // concept), and a month outside the term belongs to no contract at all.
    // The submit button is disabled for both; this catches the paths that
    // bypass the button, and the service refuses them regardless — the page
    // may have gone stale.
    if (periodRejected) {
      toast.error(
        t(periodOutsideTerm ? 'form.periodOutsideTerm' : 'form.periodCovered'),
      );
      return;
    }

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
                      // A hand-picked month is left alone, unless the contract
                      // that just replaced this one can't settle it.
                      const current = form.getValues('periodStart');
                      const month = current ? periodToMonthValue(current) : '';
                      if (!periodPicked || month !== clampToTerm(c, month)) {
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
                      min={selectedContract?.min}
                      max={selectedContract?.max}
                      onChange={(month) => {
                        setPeriodPicked(true);
                        field.onChange(monthValueToDate(month));
                      }}
                    />
                    {periodRejected ? (
                      <p className="text-destructive text-[0.8rem] font-medium">
                        {t(
                          periodOutsideTerm
                            ? 'form.periodOutsideTerm'
                            : 'form.periodCovered',
                        )}
                      </p>
                    ) : (
                      <>
                        <FormDescription>
                          {periodRange ?? t('form.periodHint')}
                        </FormDescription>
                        <FormMessage />
                      </>
                    )}
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
          <Button
            type="submit"
            loading={isPending}
            disabled={proofUploading || periodRejected}
          >
            {t('form.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
