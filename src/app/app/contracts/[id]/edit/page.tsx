import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { contractService } from '@/features/contracts/services/contract.service';
import { propertyService } from '@/features/properties/services/property.service';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { ContractForm } from '@/features/contracts/components/contract-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('editContract') };
}

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const [contract, properties, tenants] = await Promise.all([
    contractService.getById(ownerId, id).catch((error) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }),
    propertyService.options(ownerId),
    tenantService.options(ownerId),
  ]);

  const t = await getTranslations('contracts.edit');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <ContractForm
        mode="edit"
        contractId={contract.id}
        properties={properties.map((p) => ({ id: p.id, label: p.name }))}
        tenants={tenants.map((t) => ({
          id: t.id,
          label: `${t.firstName} ${t.lastName}`,
        }))}
        defaultValues={{
          propertyId: contract.property.id,
          tenantId: contract.tenant.id,
          startDate: contract.startDate,
          endDate: contract.endDate ?? undefined,
          monthlyRent: Number(contract.monthlyRent),
          currency: contract.currency,
          dueDay: contract.dueDay,
          securityDeposit: Number(contract.securityDeposit),
          maintenanceIncluded: contract.maintenanceIncluded,
          status: contract.status,
          notes: contract.notes ?? undefined,
        }}
      />
    </div>
  );
}
