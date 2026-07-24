'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Paperclip, UploadCloud, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/shared/lib/utils';

export type DropzoneFile = {
  name: string;
  /** Public URL once stored; absent while the upload is still in flight. */
  url?: string | null;
};

type BaseProps = {
  /** Same syntax as the input's `accept`: extensions (`.pdf`) and/or MIME
   * types (`image/png`, `image/*`) may be mixed. */
  accept: string;
  maxMb: number;
  uploading?: boolean;
  disabled?: boolean;
  /** Overrides the generic size/type line. */
  hint?: ReactNode;
};

type SingleProps = BaseProps & {
  multiple?: false;
  /** The already-uploaded file; renders the "attached" state. */
  value?: DropzoneFile | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  /** Receives every file that passed validation, in the order dropped. */
  onSelect: (files: File[]) => void;
};

/** Discriminated on `multiple`, so the callback's shape is checked for you. */
type FileDropzoneProps = SingleProps | MultiProps;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/** `accept` entries may be extensions, exact MIME types, or `type/*`. */
function matchesAccept(file: File, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const ext = extensionOf(file.name);
  const mime = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return pattern === ext;
    if (pattern.endsWith('/*')) return mime.startsWith(pattern.slice(0, -1));
    return pattern === mime;
  });
}

/**
 * Drop target: drag files in or click to browse.
 *
 * Single-file by default, because most callers (payment proof, contract PDF,
 * avatar, signature) store exactly one blob and accepting more would only
 * create ambiguity about which one wins. Pass `multiple` for galleries.
 */
export function FileDropzone(props: FileDropzoneProps) {
  const { accept, maxMb, uploading = false, disabled = false, hint } = props;
  const multiple = props.multiple === true;

  const t = useTranslations('dropzone');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = disabled || uploading;
  const value = props.multiple ? null : props.value;

  const allowed = accept
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  function validate(file: File): string | null {
    if (!matchesAccept(file, allowed)) return t('wrongType');
    if (file.size > maxMb * 1024 * 1024) {
      return t('tooLarge', { mb: maxMb });
    }
    return null;
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (!props.multiple) {
      // Reject rather than silently picking one, so nothing is lost quietly.
      if (files.length > 1) {
        setError(t('onlyOne'));
        return;
      }
      const file = files[0];
      if (!file) return;
      const problem = validate(file);
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      props.onSelect(file);
      return;
    }

    // Bulk drop: take everything valid and report the rest, so one bad file
    // in a batch of twenty doesn't force the user to start over.
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const problem = validate(file);
      if (problem) rejected.push(file.name);
      else accepted.push(file);
    }

    setError(
      rejected.length > 0
        ? t('someRejected', {
            count: rejected.length,
            names: rejected.slice(0, 3).join(', '),
          })
        : null,
    );
    if (accepted.length > 0) props.onSelect(accepted);
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            {value.url ? (
              <a
                href={value.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium text-primary hover:underline"
              >
                {value.name}
              </a>
            ) : (
              <span className="truncate text-sm font-medium">{value.name}</span>
            )}
          </span>
          {!props.multiple && props.onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onRemove}
              disabled={busy}
              aria-label={t('remove')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          'hover:border-primary/50 hover:bg-muted/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          dragging && 'border-primary bg-primary/5',
          error && !dragging && 'border-destructive/60',
          busy && 'cursor-not-allowed opacity-60 hover:border-inherit hover:bg-transparent',
        )}
      >
        {uploading ? (
          <>
            <Paperclip className="size-6 animate-pulse text-muted-foreground" />
            <span className="text-sm font-medium">{t('uploading')}</span>
          </>
        ) : (
          <>
            <UploadCloud
              className={cn(
                'size-6 text-muted-foreground transition-colors',
                dragging && 'text-primary',
              )}
            />
            <span className="text-sm font-medium">
              {dragging
                ? t(multiple ? 'dropHereMany' : 'dropHere')
                : t(multiple ? 'ctaMany' : 'cta')}
            </span>
            <span className="text-xs text-muted-foreground">
              {hint ?? t(multiple ? 'hintMany' : 'hint', { mb: maxMb })}
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
