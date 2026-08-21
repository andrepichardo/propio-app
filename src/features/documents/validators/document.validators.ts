import { z } from 'zod';
import { DocumentType } from '@/generated/prisma/enums';

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const uploadDocumentSchema = z.object({
  name: z.string().trim().min(1, 'documentNameRequired').max(160),
  type: z.nativeEnum(DocumentType).default(DocumentType.OTHER),
  propertyId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  tenantId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});

export const deleteDocumentSchema = z.object({ id: z.string().cuid() });

export const documentFiltersSchema = z.object({
  type: z.nativeEnum(DocumentType).optional(),
  propertyId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type DocumentFilters = z.infer<typeof documentFiltersSchema>;
