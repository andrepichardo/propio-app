'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PenLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { SignaturePad } from './signature-pad';
import {
  removeSignatureAction,
  updateSignatureAction,
} from '../actions/settings.actions';

/** Upload the handwritten signature stamped on receipt PDFs. */
export function SignatureUploader({
  signatureUrl,
}: {
  signatureUrl?: string | null;
}) {
  const t = useTranslations('settings');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function onFileSelected(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.set('file', file);
    startTransition(async () => {
      const result = await updateSignatureAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('signatureUpdated'));
      router.refresh();
    });
  }

  function onRemove() {
    startTransition(async () => {
      const result = await removeSignatureAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('signatureRemoved'));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-44 items-center justify-center overflow-hidden rounded-lg border bg-white p-2">
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, unoptimized preview is fine
          <img
            src={signatureUrl}
            alt={t('signature')}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-muted-foreground text-xs">
            {t('noSignature')}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <SignaturePad onSave={(file) => onFileSelected(file)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <PenLine className="size-4" /> {t('uploadSignature')}
          </Button>
          {signatureUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={onRemove}
            >
              <Trash2 className="size-4" /> {t('remove')}
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">{t('signatureHint')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          onFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
