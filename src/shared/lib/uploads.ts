import 'server-only';
import { ValidationError } from '@/shared/lib/errors';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PDF_MIME_TYPES = ['application/pdf'] as const;

export type UploadedFile = {
  name: string;
  type: string;
  size: number;
  bytes: ArrayBuffer;
};

/**
 * Validate a `FormData` file entry (presence, size, MIME) and read its bytes.
 * Throws typed {@link ValidationError}s so actions surface friendly messages.
 */
export async function readUploadedFile(
  value: unknown,
  options: { maxBytes: number; mimeTypes: readonly string[] },
): Promise<UploadedFile> {
  if (!(value instanceof File) || value.size === 0) {
    throw new ValidationError('Choose a file to upload.', {
      file: ['Choose a file to upload.'],
    });
  }
  if (value.size > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024));
    throw new ValidationError(`File is too large (max ${maxMb} MB).`);
  }
  if (!options.mimeTypes.includes(value.type)) {
    throw new ValidationError('Unsupported file type.');
  }
  return {
    name: value.name,
    type: value.type,
    size: value.size,
    bytes: await value.arrayBuffer(),
  };
}

export function fileExtension(name: string): string {
  return name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
}
