'use client';

import { type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { CreateExpenseInput } from '../validators/expense.validators';
import { EXPENSE_CATEGORY_VALUES } from '../constants';
import type { OptionItem } from '@/features/contracts/components/contract-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const NONE = 'none';

/**
 * Shared field set for the expense form, reused by both the create dialog and
 * any future edit surface so the inputs never drift.
 */
export function ExpenseFormFields({
  form,
  properties,
}: {
  form: UseFormReturn<CreateExpenseInput>;
  properties: OptionItem[];
}) {
  const t = useTranslations('expenses');
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel required>{t('form.description')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('form.descriptionPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.category')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EXPENSE_CATEGORY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`categories.${value}`)}
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
        name="incurredAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{t('form.date')}</FormLabel>
            <DatePicker value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="propertyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.property')}</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === NONE ? undefined : value)
              }
              value={field.value ?? NONE}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.portfolioWide')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>{t('form.portfolioWide')}</SelectItem>
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
        name="vendor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.vendor')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
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
    </div>
  );
}
