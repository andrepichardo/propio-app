'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { DocumentType } from '@prisma/client';
import { DOCUMENT_TYPE_VALUES } from '../constants';
import { uploadDocumentAction } from '../actions/document.actions';
import type { OptionItem } from '@/features/contracts/components/contract-form';
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

const NONE = 'none';

export function UploadDocumentDialog({
  properties,
}: {
  properties: OptionItem[];
}) {
  const t = useTranslations('documents');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [docType, setDocType] = useState<DocumentType>(DocumentType.OTHER);
  const [propertyId, setPropertyId] = useState<string>(NONE);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('type', docType);
    if (propertyId !== NONE) formData.set('propertyId', propertyId);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('uploadedToast'));
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" /> {t('upload')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.desc')}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">{t('dialog.file')}</Label>
            <Input
              id="doc-file"
              name="file"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-name">{t('dialog.name')}</Label>
            <Input
              id="doc-name"
              name="name"
              placeholder={t('dialog.namePlaceholder')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('dialog.type')}</Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`types.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('dialog.property')}</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('dialog.unlinked')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('dialog.unlinked')}</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('dialog.cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {t('dialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
