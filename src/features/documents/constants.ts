import { DocumentType } from '@prisma/client';
import {
  FileImage,
  FileSignature,
  FileText,
  IdCard,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';

/** Keys under `documents.types` are the enum values; translate with
 * `t(\`types.${value}\`)`. */
export const DOCUMENT_TYPE_VALUES = Object.values(DocumentType);

/** Mirrors MAX_DOCUMENT_SIZE_BYTES; kept here for the client-side hint. */
export const MAX_DOCUMENT_MB = 10;
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  [DocumentType.CONTRACT]: FileSignature,
  [DocumentType.PHOTO]: FileImage,
  [DocumentType.INVOICE]: ReceiptText,
  [DocumentType.ID]: IdCard,
  [DocumentType.OTHER]: FileText,
};

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
