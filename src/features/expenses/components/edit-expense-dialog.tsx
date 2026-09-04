'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import type { ExpenseCategory } from '@/generated/prisma/enums';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '../validators/expense.validators';
import { updateExpenseAction } from '../actions/expense.actions';
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

export type EditableExpense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  incurredAt: string; // ISO — Decimal/Date already serialised by the server
  vendor?: string | null;
  notes?: string | null;
  propertyId?: string | null;
};

export function EditExpenseDialog({
  expense,
  properties,
}: {
  expense: EditableExpense;
  properties: OptionItem[];
}) {
  const t = useTranslations('expenses');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      incurredAt: new Date(expense.incurredAt),
      vendor: expense.vendor ?? '',
      notes: expense.notes ?? '',
      propertyId: expense.propertyId ?? undefined,
    },
  });

  function onSubmit(values: CreateExpenseInput) {
    startTransition(async () => {
      const result = await updateExpenseAction({ ...values, id: expense.id });
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
          className="text-muted-foreground hover:text-foreground size-8"
          aria-label={t('editAria')}
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
          <DialogDescription>{t('edit.desc')}</DialogDescription>
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
                {t('edit.cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('edit.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
