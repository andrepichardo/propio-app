import type { Metadata } from 'next';
import { PageHeader } from '@/shared/components/page-header';
import { PropertyForm } from '@/features/properties/components/property-form';

export const metadata: Metadata = { title: 'New property' };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add a property"
        description="Create a new property to start managing it in Propio."
      />
      <PropertyForm mode="create" />
    </div>
  );
}
