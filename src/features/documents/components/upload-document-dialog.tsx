'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { DocumentType } from '@/generated/prisma/enums';
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPE_VALUES,
  MAX_DOCUMENT_MB,
} from '../constants';
import { uploadDocumentAction } from '../actions/document.actions';
import type { OptionItem } from '@/features/contracts/components/contract-form';
import { Button } from '@/shared/components/ui/button';
import { FileDropzone } from '@/shared/components/ui/file-dropzone';
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
  tenants,
}: {
  properties: OptionItem[];
  tenants: OptionItem[];
}) {
  const t = useTranslations('documents');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [docType, setDocType] = useState<DocumentType>(DocumentType.OTHER);
  const [propertyId, setPropertyId] = useState<string>(NONE);
  const [tenantId, setTenantId] = useState<string>(NONE);
  // Held in state instead of a native file input: the dropzone owns the file.
  const [file, setFile] = useState<File | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      toast.error(t('dialog.fileRequired'));
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set('file', file);
    formData.set('type', docType);
    if (propertyId !== NONE) formData.set('propertyId', propertyId);
    if (tenantId !== NONE) formData.set('tenantId', tenantId);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('uploadedToast'));
      setOpen(false);
      formRef.current?.reset();
      setFile(null);
      setDocType(DocumentType.OTHER);
      setPropertyId(NONE);
      setTenantId(NONE);
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
            <Label>
              {t('dialog.file')}
              <span aria-hidden className="text-destructive ml-0.5">
                *
              </span>
            </Label>
            <FileDropzone
              accept={DOCUMENT_ACCEPT}
              maxMb={MAX_DOCUMENT_MB}
              value={file ? { name: file.name } : null}
              disabled={isPending}
              onSelect={setFile}
              onRemove={() => setFile(null)}
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
          <div className="space-y-1.5">
            <Label>{t('dialog.tenant')}</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.unlinked')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('dialog.unlinked')}</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
