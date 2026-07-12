'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { deleteExpenseAction } from '../actions/expense.actions';

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExpenseAction({ id: expenseId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('deletedToast'));
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive"
      loading={isPending}
      onClick={handleDelete}
      aria-label={t('deleteAria')}
    >
      {!isPending && <Trash2 className="size-4" />}
    </Button>
  );
}
