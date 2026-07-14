'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { ExpenseCategory } from '@prisma/client';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '../validators/expense.validators';
import { createExpenseAction } from '../actions/expense.actions';
import { ExpenseFormFields } from './expense-form-fields';
import type { OptionItem } from '@/features/contracts/components/contract-form';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import { Form } from '@/shared/components/ui/form';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';

export function CreateExpenseDialog({
  properties,
  defaultCurrency = 'USD',
}: {
  properties: OptionItem[];
  defaultCurrency?: string;
}) {
  const t = useTranslations('expenses');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: '',
      category: ExpenseCategory.MAINTENANCE,
      amount: 0,
      currency: defaultCurrency,
      incurredAt: new Date(),
      vendor: '',
      notes: '',
      propertyId: undefined,
    },
  });

  function onSubmit(values: CreateExpenseInput) {
    startTransition(async () => {
      const result = await createExpenseAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('loggedToast'));
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> {t('logExpense')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
          <DialogDescription>{t('create.desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ExpenseFormFields form={form} properties={properties} />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t('create.cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('create.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
