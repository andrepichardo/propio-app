'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  deletePropertyPhotoAction,
  uploadPropertyPhotoAction,
} from '../actions/property-photo.actions';
import {
  MAX_PROPERTY_PHOTO_MB,
  PROPERTY_PHOTO_ACCEPT,
} from '../constants';
import { PhotoLightbox } from './photo-lightbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { FileDropzone } from '@/shared/components/ui/file-dropzone';
import { formatDate } from '@/shared/lib/format';

export type PropertyPhotoItem = {
  id: string;
  url: string;
  caption?: string | null;
  createdAt: Date;
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
  // Separate transitions so deleting never lights up the dropzone's
  // "uploading" state (and vice versa).
  const [uploadPending, startUpload] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /**
   * Uploaded one at a time on purpose: the server derives each photo's
   * `position` from how many the property already has, so parallel uploads
   * would race and collide on the same index.
   */
  function onFilesChosen(files: File[]) {
    startUpload(async () => {
      let uploaded = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.set('propertyId', propertyId);
        formData.set('file', file);

        const result = await uploadPropertyPhotoAction(formData);
        if (!result.success) {
          toast.error(result.error);
          break;
        }
        uploaded += 1;
      }

      if (uploaded > 0) {
        toast.success(t('addedToast', { count: uploaded }));
        router.refresh();
      }
    });
  }

  function removePhoto(id: string) {
    startDelete(async () => {
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
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{t('hint')}</CardDescription>
        <div className="mb-5">
          <FileDropzone
            multiple
            accept={PROPERTY_PHOTO_ACCEPT}
            maxMb={MAX_PROPERTY_PHOTO_MB}
            uploading={uploadPending}
            onSelect={onFilesChosen}
          />
        </div>
        {photos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
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
                {/* Overlay button opens the viewer; sits below the controls. */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={t('view')}
                  className="absolute inset-0 z-10 cursor-zoom-in"
                />
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-xs font-medium text-white">
                  {formatDate(photo.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  disabled={deletePending}
                  aria-label={t('deleteAria')}
                  className="absolute right-2 top-2 z-20 rounded-md bg-background/90 p-1.5 opacity-0 shadow-soft transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </Card>
  );
}
