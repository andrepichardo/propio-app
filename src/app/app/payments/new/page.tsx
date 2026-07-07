import type { Metadata } from 'next';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { PaymentForm } from '@/features/payments/components/payment-form';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Register payment' };

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { contractId } = await searchParams;

  const contracts = await contractRepository.activeOptions(ownerId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Register a payment"
        description="Recording a payment generates a receipt and updates your dashboard automatically."
      />
      <PaymentForm
        defaultContractId={contractId}
        contracts={contracts.map((c) => ({
          id: c.id,
          rent: Number(c.monthlyRent),
          currency: c.currency,
          label: `${c.property.name} · ${c.tenant.firstName} ${c.tenant.lastName}`,
        }))}
      />
    </div>
  );
}
