import 'server-only';
import { randomUUID } from 'crypto';
import { ActivityAction } from '@/generated/prisma/enums';
import { prisma } from '@/shared/lib/prisma';
import { documentRepository } from '../repositories/document.repository';
import {
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  type DocumentFilters,
  type UploadDocumentInput,
} from '../validators/document.validators';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/shared/lib/errors';
import { getStorage } from '@/shared/lib/storage';
import { logActivity } from '@/shared/lib/activity/activity-logger';

async function assertRelationsOwnership(
  ownerId: string,
  propertyId?: string,
  tenantId?: string,
): Promise<void> {
  const checks: Promise<unknown | null>[] = [];
  if (propertyId) {
    checks.push(
      prisma.property.findFirst({
        where: { id: propertyId, ownerId, deletedAt: null },
        select: { id: true },
      }),
    );
  }
  if (tenantId) {
    checks.push(
      prisma.tenant.findFirst({
        where: { id: tenantId, ownerId, deletedAt: null },
        select: { id: true },
      }),
    );
  }
  const results = await Promise.all(checks);
  if (results.some((r) => r === null)) {
    throw new ForbiddenError('Linked record not found in your account.');
  }
}

export const documentService = {
  list(ownerId: string, filters: DocumentFilters) {
    return documentRepository.list(ownerId, filters);
  },

  /**
   * Validate and persist an uploaded file: bytes go to storage under an
   * owner-scoped key, metadata goes to Postgres.
   */
  async upload(
    ownerId: string,
    input: UploadDocumentInput,
    file: { name: string; type: string; size: number; bytes: ArrayBuffer },
  ) {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ValidationError('File is too large (max 10 MB).');
    }
    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new ValidationError(
        'Unsupported file type. Upload a PDF, image or Word document.',
      );
    }
    await assertRelationsOwnership(ownerId, input.propertyId, input.tenantId);

    const extension = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.'))
      : '';
    const key = `documents/${ownerId}/${randomUUID()}${extension}`;

    const { url } = await getStorage().upload({
      key,
      body: file.bytes,
      contentType: file.type,
    });

    const document = await documentRepository.create({
      ownerId,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      name: input.name,
      type: input.type,
      url,
      storageKey: key,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    await logActivity({
      ownerId,
      action: ActivityAction.CREATED,
      entityType: 'Document',
      entityId: document.id,
      summary: `Uploaded document “${input.name}”`,
      messageKey: 'documentUploaded',
      params: { name: input.name },
    });

    return document;
  },

  async remove(ownerId: string, id: string) {
    const document = await documentRepository.findById(ownerId, id);
    if (!document) throw new NotFoundError('Document');

    const deleted = await documentRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Document');

    // Best-effort blob cleanup; metadata soft-delete is the source of truth.
    try {
      await getStorage().remove(document.storageKey);
    } catch (error) {
      console.warn('[documents] failed to delete blob', error);
    }

    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Document',
      entityId: id,
      summary: `Deleted document “${document.name}”`,
      messageKey: 'documentDeleted',
      params: { name: document.name },
    });

    return { id };
  },
};
