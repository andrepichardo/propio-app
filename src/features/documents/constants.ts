import { DocumentType } from '@prisma/client';
import {
  FileImage,
  FileSignature,
  FileText,
  IdCard,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.CONTRACT]: 'Contract',
  [DocumentType.PHOTO]: 'Photo',
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.ID]: 'Identification',
  [DocumentType.OTHER]: 'Other',
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  [DocumentType.CONTRACT]: FileSignature,
  [DocumentType.PHOTO]: FileImage,
  [DocumentType.INVOICE]: ReceiptText,
  [DocumentType.ID]: IdCard,
  [DocumentType.OTHER]: FileText,
};

export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map(
  (value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }),
);

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
