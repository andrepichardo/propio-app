'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ImagePlus, Trash2 } from 'lucide-react';
import {
  deletePropertyPhotoAction,
  uploadPropertyPhotoAction,
} from '../actions/property-photo.actions';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export type PropertyPhotoItem = {
  id: string;
  url: string;
  caption?: string | null;
};

export function PropertyPhotos({
  propertyId,
  photos,
}: {
  propertyId: string;
  photos: PropertyPhotoItem[];
}) {
  const t = useTranslations('properties.photos');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.set('propertyId', propertyId);
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadPropertyPhotoAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('addedToast'));
      router.refresh();
    });
  }

  function removePhoto(id: string) {
    startTransition(async () => {
      const result = await deletePropertyPhotoAction({ id, propertyId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('removedToast'));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          loading={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {!isPending && <ImagePlus className="size-4" />} {t('add')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChosen}
        />
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? t('title')}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  disabled={isPending}
                  aria-label={t('deleteAria')}
                  className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5 opacity-0 shadow-soft transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
