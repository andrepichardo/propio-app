'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useFormatDate } from '@/shared/components/date-format-provider';
import type { PropertyPhotoItem } from './property-photos';

/**
 * Full-screen photo viewer with prev/next navigation. Self-contained (no
 * external lightbox lib): a fixed overlay, keyboard controls and a scroll
 * lock while open.
 */
export function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: PropertyPhotoItem[];
  /** Index of the open photo, or null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const t = useTranslations('properties.photos');
  const formatDate = useFormatDate();
  const isOpen = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = (index + delta + photos.length) % photos.length;
      onNavigate(next);
    },
    [index, photos.length, onNavigate],
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    }
    document.addEventListener('keydown', onKey);
    // Freeze background scroll while the viewer is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, go, onClose]);

  if (index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  const hasMany = photos.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('viewerAria')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label={t('previous')}
          className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-6"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Stop propagation so clicks on the image itself don't close. */}
      <figure
        className="relative flex max-h-full max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[70vh] w-[85vw] max-w-4xl">
          <Image
            src={photo.url}
            alt={photo.caption ?? t('title')}
            fill
            sizes="85vw"
            className="object-contain"
            priority
          />
        </div>
        <figcaption className="flex items-center gap-3 text-sm text-white/80">
          <span>{formatDate(photo.createdAt)}</span>
          {hasMany && (
            <span className="text-white/50">
              {index + 1} / {photos.length}
            </span>
          )}
        </figcaption>
      </figure>

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label={t('next')}
          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-6"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  );
}
