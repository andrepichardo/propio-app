'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { deleteContractAction } from '../actions/contract.actions';

export function DeleteContractDialog({
  contractId,
}: {
  contractId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContractAction({ id: contractId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Contract cancelled.');
      setOpen(false);
      router.push('/app/contracts');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <Trash2 className="size-4" /> Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this contract?</DialogTitle>
          <DialogDescription>
            The contract will be marked cancelled and archived. Recorded
            payments and receipts are preserved for your records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Keep contract
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isPending}
          >
            Cancel contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
