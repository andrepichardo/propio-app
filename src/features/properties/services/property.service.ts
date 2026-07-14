import 'server-only';
import { randomUUID } from 'crypto';
import { ActivityAction } from '@prisma/client';
import { propertyRepository } from '../repositories/property.repository';
import type {
  CreatePropertyInput,
  PropertyFilters,
  UpdatePropertyInput,
} from '../validators/property.validators';
import { NotFoundError } from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { getStorage } from '@/shared/lib/storage';
import { fileExtension, type UploadedFile } from '@/shared/lib/uploads';

/**
 * Property business logic. Orchestrates the repository, enforces existence,
 * and records audit-trail activity. Actions call into here — never straight
 * into the repository — so cross-cutting concerns live in one place.
 */
export const propertyService = {
  list(ownerId: string, filters: PropertyFilters) {
    return propertyRepository.list(ownerId, filters);
  },

  options(ownerId: string) {
    return propertyRepository.options(ownerId);
  },

  async getById(ownerId: string, id: string) {
    const property = await propertyRepository.findById(ownerId, id);
    if (!property) throw new NotFoundError('Property');
    return property;
  },

  async create(ownerId: string, input: CreatePropertyInput) {
    const property = await propertyRepository.create(ownerId, {
      name: input.name,
      description: input.description,
      type: input.type,
      status: input.status,
      addressLine: input.addressLine,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country?.toUpperCase(),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      areaSqm: input.areaSqm,
      coverImageUrl: input.coverImageUrl || undefined,
    });

    await logActivity({
      ownerId,
      action: ActivityAction.CREATED,
      entityType: 'Property',
      entityId: property.id,
      summary: `Added property “${property.name}”`,
      messageKey: 'propertyAdded',
      params: { name: property.name },
    });

    return property;
  },

  async update(ownerId: string, input: UpdatePropertyInput) {
    const { id, ...rest } = input;
    const updated = await propertyRepository.update(ownerId, id, {
      ...rest,
      country: rest.country?.toUpperCase(),
      coverImageUrl: rest.coverImageUrl || undefined,
    });
    if (!updated) throw new NotFoundError('Property');

    await logActivity({
      ownerId,
      action: ActivityAction.UPDATED,
      entityType: 'Property',
      entityId: updated.id,
      summary: `Updated property “${updated.name}”`,
      messageKey: 'propertyUpdated',
      params: { name: updated.name },
    });

    return updated;
  },

  async remove(ownerId: string, id: string) {
    const deleted = await propertyRepository.softDelete(ownerId, id);
    if (!deleted) throw new NotFoundError('Property');

    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'Property',
      entityId: id,
      summary: 'Deleted a property',
      messageKey: 'propertyDeleted',
    });

    return { id };
  },

  /**
   * Upload a photo to storage and attach it to the property. The first photo
   * automatically becomes the cover image.
   */
  async addPhoto(ownerId: string, propertyId: string, file: UploadedFile) {
    const property = await propertyRepository.findById(ownerId, propertyId);
    if (!property) throw new NotFoundError('Property');

    const key = `properties/${ownerId}/${propertyId}/${randomUUID()}${fileExtension(file.name)}`;
    const { url } = await getStorage().upload({
      key,
      body: file.bytes,
      contentType: file.type,
    });

    const photo = await propertyRepository.createPhoto({
      propertyId,
      url,
      storageKey: key,
      position: property.photos.length,
    });

    if (!property.coverImageUrl) {
      await propertyRepository.setCoverImage(propertyId, url);
    }

    return photo;
  },

  /** Remove a photo; if it was the cover, promote the next one (or clear). */
  async removePhoto(ownerId: string, photoId: string) {
    const photo = await propertyRepository.findPhoto(ownerId, photoId);
    if (!photo) throw new NotFoundError('Photo');

    await propertyRepository.deletePhoto(photoId);

    try {
      await getStorage().remove(photo.storageKey);
    } catch (error) {
      console.warn('[properties] failed to delete photo blob', error);
    }

    if (photo.property.coverImageUrl === photo.url) {
      const next = await propertyRepository.firstPhoto(photo.property.id);
      await propertyRepository.setCoverImage(
        photo.property.id,
        next?.url ?? null,
      );
    }

    return { id: photoId };
  },
};
