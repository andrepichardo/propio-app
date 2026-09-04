'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { getInitials } from '@/shared/lib/format';
import {
  removeAvatarAction,
  updateAvatarAction,
} from '../actions/settings.actions';

export function AvatarUploader({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
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
      const result = await updateAvatarAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('photoUpdated'));
      router.refresh();
    });
  }

  function onRemove() {
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('photoRemoved'));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {image ? <AvatarImage src={image} alt={name ?? 'User'} /> : null}
        <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="size-4" /> {t('changePhoto')}
          </Button>
          {image ? (
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
        <p className="text-muted-foreground text-xs">{t('photoHint')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          onFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
