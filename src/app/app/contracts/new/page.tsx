import type { Metadata } from 'next';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { propertyService } from '@/features/properties/services/property.service';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { ContractForm } from '@/features/contracts/components/contract-form';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'New contract' };

export default async function NewContractPage() {
  const ownerId = await requireOwnerId();
  const [properties, tenants] = await Promise.all([
    propertyService.options(ownerId),
    tenantService.options(ownerId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New contract"
        description="Set the terms for a tenant and property."
      />
      <ContractForm
        mode="create"
        properties={properties.map((p) => ({ id: p.id, label: p.name }))}
        tenants={tenants.map((t) => ({
          id: t.id,
          label: `${t.firstName} ${t.lastName}`,
        }))}
      />
    </div>
  );
}
