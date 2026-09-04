import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { contractRepository } from '@/features/contracts/repositories/contract.repository';
import { paymentService } from '@/features/payments/services/payment.service';
import { PaymentForm } from '@/features/payments/components/payment-form';
import { contractAnchorDay, periodMonthBounds } from '@/shared/lib/rent-period';
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
  // Periods run start-day to start-day, so the anchor is the contract's start
  // date — NOT its due day, which only says when the rent must be paid. Bounds
  // are resolved here rather than in the form: the client gets two `yyyy-MM`
  // strings instead of dates it would have to re-anchor itself.
  const options = contracts.map((c) => {
    const anchorDay = contractAnchorDay(c.startDate);
    return {
      id: c.id,
      rent: Number(c.monthlyRent),
      anchorDay,
      dueDay: c.dueDay,
      currency: c.currency,
      label: `${c.property.name} · ${c.tenant.firstName} ${c.tenant.lastName}`,
      ...periodMonthBounds(c, anchorDay),
    };
  });

  const [covered, t] = await Promise.all([
    paymentService.coveredPeriods(
      ownerId,
      options.map((o) => ({
        id: o.id,
        monthlyRent: o.rent,
        anchorDay: o.anchorDay,
      })),
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
