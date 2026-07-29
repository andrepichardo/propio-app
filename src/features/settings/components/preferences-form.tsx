'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  updatePreferencesSchema,
  type UpdatePreferencesInput,
} from '../validators/settings.validators';
import { updatePreferencesAction } from '../actions/settings.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import { cn } from '@/shared/lib/utils';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { CURRENCY_CODES } from '@/shared/lib/currencies';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

/**
 * Money formatting + reminder settings, saved together with a single submit.
 * Two cards for visual grouping, one form underneath. Password lives in its own
 * form (different action, needs the current password).
 */
export function PreferencesForm({
  defaultValues,
}: {
  defaultValues: UpdatePreferencesInput;
}) {
  const t = useTranslations('settings');
  const tc = useTranslations('currencies');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePreferencesInput>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues,
  });

  const contractOn = form.watch('notifyContractExpiring');
  const upcomingOn = form.watch('notifyPaymentUpcoming');

  function onSubmit(values: UpdatePreferencesInput) {
    startTransition(async () => {
      const result = await updatePreferencesAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('preferencesUpdated'));
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Formatting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('formatting')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel>{t('currency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCY_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code} — {tc(code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('currencyHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reminders')}</CardTitle>
            <CardDescription>{t('remindersHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ReminderRow
              title={t('reminderContractExpiring')}
              description={t('reminderContractExpiringDesc')}
              toggle={
                <ReminderSwitch form={form} name="notifyContractExpiring" />
              }
              lead={
                <LeadDaysField
                  form={form}
                  name="contractExpiringLeadDays"
                  enabled={contractOn}
                  min={1}
                  max={180}
                  t={t}
                />
              }
            />

            <Separator />

            <ReminderRow
              title={t('reminderPaymentUpcoming')}
              description={t('reminderPaymentUpcomingDesc')}
              toggle={
                <ReminderSwitch form={form} name="notifyPaymentUpcoming" />
              }
              lead={
                <LeadDaysField
                  form={form}
                  name="paymentUpcomingLeadDays"
                  enabled={upcomingOn}
                  min={0}
                  max={30}
                  t={t}
                />
              }
            />

            <Separator />

            {/* Payment late — no lead time, it fires once overdue */}
            <ReminderRow
              title={t('reminderPaymentLate')}
              description={t('reminderPaymentLateDesc')}
              toggle={<ReminderSwitch form={form} name="notifyPaymentLate" />}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            {t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type PrefsFormApi = ReturnType<typeof useForm<UpdatePreferencesInput>>;
type SwitchName =
  | 'notifyContractExpiring'
  | 'notifyPaymentUpcoming'
  | 'notifyPaymentLate';
type LeadName = 'contractExpiringLeadDays' | 'paymentUpcomingLeadDays';

function ReminderRow({
  title,
  description,
  toggle,
  lead,
}: {
  title: string;
  description: string;
  toggle: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 pr-2">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="pt-0.5">{toggle}</div>
      </div>
      {lead}
    </div>
  );
}

function ReminderSwitch({
  form,
  name,
}: {
  form: PrefsFormApi;
  name: SwitchName;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function LeadDaysField({
  form,
  name,
  enabled,
  min,
  max,
  t,
}: {
  form: PrefsFormApi;
  name: LeadName;
  enabled: boolean;
  min: number;
  max: number;
  t: ReturnType<typeof useTranslations<'settings'>>;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            'flex flex-wrap items-center gap-2 transition-opacity',
            !enabled && 'opacity-50',
          )}
        >
          <span className="text-sm text-muted-foreground">
            {t('leadBefore')}
          </span>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              className="h-8 w-16"
              disabled={!enabled}
              {...field}
            />
          </FormControl>
          <span className="text-sm text-muted-foreground">
            {t('leadDaysUnit')}
          </span>
          <FormMessage className="w-full" />
        </FormItem>
      )}
    />
  );
}
