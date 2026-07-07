import type { Metadata } from 'next';
import { PageHeader } from '@/shared/components/page-header';
import { TenantForm } from '@/features/tenants/components/tenant-form';

export const metadata: Metadata = { title: 'New tenant' };

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add a tenant"
        description="Store contact details so you can link them to contracts."
      />
      <TenantForm mode="create" />
    </div>
  );
}
