import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { propertyService } from '@/features/properties/services/property.service';
import { PropertyForm } from '@/features/properties/components/property-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('editProperty') };
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const property = await propertyService.getById(ownerId, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const t = await getTranslations('properties.edit');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle', { name: property.name })}
      />
      <PropertyForm
        mode="edit"
        propertyId={property.id}
        defaultValues={{
          name: property.name,
          description: property.description ?? undefined,
          type: property.type,
          status: property.status,
          addressLine: property.addressLine ?? undefined,
          city: property.city ?? undefined,
          state: property.state ?? undefined,
          postalCode: property.postalCode ?? undefined,
          country: property.country ?? undefined,
          bedrooms: property.bedrooms ?? undefined,
          bathrooms: property.bathrooms ?? undefined,
          areaSqm: property.areaSqm ? Number(property.areaSqm) : undefined,
          furnishing: property.furnishing,
          parkingSpaces: property.parkingSpaces ?? undefined,
          petsAllowed: property.petsAllowed,
          hasPowerBackup: property.hasPowerBackup,
          hasWaterTank: property.hasWaterTank,
          hasAirConditioning: property.hasAirConditioning,
        }}
      />
    </div>
  );
}
