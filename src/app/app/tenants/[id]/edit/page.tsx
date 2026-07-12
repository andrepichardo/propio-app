import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { TenantForm } from '@/features/tenants/components/tenant-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('editTenant') };
}

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const tenant = await tenantService.getById(ownerId, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const t = await getTranslations('tenants.edit');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <TenantForm
        mode="edit"
        tenantId={tenant.id}
        defaultValues={{
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email ?? undefined,
          phone: tenant.phone ?? undefined,
          identification: tenant.identification ?? undefined,
          emergencyName: tenant.emergencyName ?? undefined,
          emergencyPhone: tenant.emergencyPhone ?? undefined,
          emergencyRelation: tenant.emergencyRelation ?? undefined,
          notes: tenant.notes ?? undefined,
        }}
      />
    </div>
  );
}
