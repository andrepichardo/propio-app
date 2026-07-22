'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PaymentMethod } from '@prisma/client';
import { Paperclip, Wallet } from 'lucide-react';
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
import { toDateInputValue } from '@/shared/lib/format';
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
  currency: string;
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
  const [isPending, startTransition] = useTransition();
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofName, setProofName] = useState<string | null>(null);

  const preselected = contracts.find((c) => c.id === defaultContractId);

  const form = useForm<RegisterPaymentInput>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      contractId: defaultContractId ?? '',
      amount: preselected?.rent ?? 0,
      method: PaymentMethod.TRANSFER,
      reference: '',
      concept: '',
      paidAt: new Date(),
      notes: '',
      proofUrl: '',
      sendReceipt: false,
    },
  });

  const proofUrl = form.watch('proofUrl');

  /** Upload as soon as a file is picked so registration only carries the URL. */
  async function onProofChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set('file', file);

    setProofUploading(true);
    const result = await uploadPaymentProofAction(formData);
    setProofUploading(false);

    if (!result.success) {
      toast.error(result.error);
      event.target.value = '';
      return;
    }
    form.setValue('proofUrl', result.data.url);
    setProofName(file.name);
  }

  function removeProof() {
    form.setValue('proofUrl', '');
    setProofName(null);
    if (proofInputRef.current) proofInputRef.current.value = '';
  }

  function onSubmit(values: RegisterPaymentInput) {
    startTransition(async () => {
      const result = await registerPaymentAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(
        t('recordedToast', { number: result.data.receiptNumber }),
      );
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
                      if (c) form.setValue('amount', c.rent);
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
                  {proofUrl ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <Paperclip className="size-4 shrink-0" />
                        <span className="truncate">
                          {proofName ?? t('form.proofView')}
                        </span>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeProof}
                        disabled={isPending}
                      >
                        {t('form.proofRemove')}
                      </Button>
                    </div>
                  ) : (
                    <FormControl>
                      <Input
                        ref={proofInputRef}
                        type="file"
                        accept={PAYMENT_PROOF_ACCEPT}
                        disabled={proofUploading}
                        onChange={onProofChange}
                      />
                    </FormControl>
                  )}
                  <FormDescription>
                    {proofUploading
                      ? t('form.proofUploading')
                      : t('form.proofHint', { mb: MAX_PAYMENT_PROOF_MB })}
                  </FormDescription>
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
