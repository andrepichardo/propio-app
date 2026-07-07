'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Upload } from 'lucide-react';
import { uploadContractPdfAction } from '../actions/contract-pdf.action';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export function ContractPdfUpload({
  contractId,
  pdfUrl,
}: {
  contractId: string;
  pdfUrl?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.set('contractId', contractId);
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadContractPdfAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Contract PDF attached.');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signed contract</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-4" /> View contract PDF
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            No signed contract attached yet.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          loading={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {!isPending && <Upload className="size-4" />}
          {pdfUrl ? 'Replace' : 'Upload PDF'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChosen}
        />
      </CardContent>
    </Card>
  );
}
