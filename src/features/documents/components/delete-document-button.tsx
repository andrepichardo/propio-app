'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { deleteDocumentAction } from '../actions/document.actions';

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDocumentAction({ id: documentId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Document deleted.');
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
      aria-label="Delete document"
    >
      {!isPending && <Trash2 className="size-4" />}
    </Button>
  );
}
