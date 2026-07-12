import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { PaymentForm } from '@/features/payments/components/payment-form';
import { PageHeader } from '@/shared/components/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('registerPayment') };
}

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { contractId } = await searchParams;

  const contracts = await contractRepository.activeOptions(ownerId);
  const t = await getTranslations('payments.new');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
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
