'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ContractStatus } from '@prisma/client';
import {
  createContractSchema,
  type CreateContractInput,
} from '../validators/contract.validators';
import { CONTRACT_STATUS_VALUES } from '../constants';
import {
  createContractAction,
  updateContractAction,
} from '../actions/contract.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
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
import { FileSignature } from 'lucide-react';
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

export type OptionItem = { id: string; label: string };

interface ContractFormProps {
  mode: 'create' | 'edit';
  contractId?: string;
  properties: OptionItem[];
  tenants: OptionItem[];
  defaultValues?: Partial<CreateContractInput>;
}

function toDateInput(value?: Date | string): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
}

export function ContractForm({
  mode,
  contractId,
  properties,
  tenants,
  defaultValues,
}: ContractFormProps) {
  const t = useTranslations('contracts');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      propertyId: '',
      tenantId: '',
      monthlyRent: 0,
      currency: 'USD',
      dueDay: 1,
      securityDeposit: 0,
      maintenanceIncluded: false,
      status: ContractStatus.ACTIVE,
      notes: '',
      ...defaultValues,
    },
  });

  function onSubmit(values: CreateContractInput) {
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createContractAction(values)
          : await updateContractAction({ ...values, id: contractId! });
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === 'create' ? t('form.createdToast') : t('form.updatedToast'),
      );
      router.push(`/app/contracts/${result.data.id}`);
      router.refresh();
    });
  }

  if (properties.length === 0 || tenants.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title={t('needBoth.title')}
        description={t('needBoth.desc')}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/app/properties/new">{t('needBoth.addProperty')}</Link>
            </Button>
            <Button asChild>
              <Link href="/app/tenants/new">{t('needBoth.addTenant')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.parties')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.property')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.selectProperty')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
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
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.tenant')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.selectTenant')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.terms')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.startDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInput(field.value)}
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
                  <FormLabel>{t('form.endDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInput(field.value ?? undefined)}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>{t('form.openEnded')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.monthlyRent')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
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
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.dueDay')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="31" {...field} />
                  </FormControl>
                  <FormDescription>{t('form.dueDayHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.securityDeposit')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTRACT_STATUS_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`statuses.${value}`)}
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
              name="maintenanceIncluded"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                  <div>
                    <FormLabel>{t('form.maintenanceIncluded')}</FormLabel>
                    <FormDescription>
                      {t('form.maintenanceHint')}
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
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
          <Button type="submit" loading={isPending}>
            {mode === 'create' ? t('form.create') : t('form.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
