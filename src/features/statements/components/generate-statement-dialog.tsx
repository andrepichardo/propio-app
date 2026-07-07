'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FilePlus2 } from 'lucide-react';
import { generateStatementAction } from '../actions/statement.actions';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export type StatementContractOption = { id: string; label: string };

export function GenerateStatementDialog({
  contracts,
}: {
  contracts: StatementContractOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [contractId, setContractId] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contractId) {
      toast.error('Select a contract.');
      return;
    }
    startTransition(async () => {
      const result = await generateStatementAction({
        contractId,
        // "yyyy-MM" coerces to the first day of that month.
        month: new Date(`${month}-01T00:00:00`),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Statement ${result.data.number} generated.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={contracts.length === 0}>
          <FilePlus2 className="size-4" /> Generate statement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate a monthly statement</DialogTitle>
          <DialogDescription>
            Summarises charges, payments and outstanding balance for a contract
            in the selected month.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Contract</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statement-month">Month</Label>
            <Input
              id="statement-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
