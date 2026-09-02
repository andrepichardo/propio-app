import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { paymentService } from '@/features/payments/services/payment.service';
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
  const options = contracts.map((c) => ({
    id: c.id,
    rent: Number(c.monthlyRent),
    dueDay: c.dueDay,
    currency: c.currency,
    label: `${c.property.name} · ${c.tenant.firstName} ${c.tenant.lastName}`,
  }));

  const [covered, t] = await Promise.all([
    paymentService.coveredPeriods(
      ownerId,
      options.map((o) => ({ id: o.id, monthlyRent: o.rent, dueDay: o.dueDay })),
    ),
    getTranslations('payments.new'),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <PaymentForm
        defaultContractId={contractId}
        contracts={options.map((o) => ({
          ...o,
          coveredPeriods: covered[o.id] ?? [],
        }))}
      />
    </div>
  );
}
