import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Pencil, Wallet } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { contractService } from '@/features/contracts/services/contract.service';
import { CONTRACT_STATUS_VARIANT } from '@/features/contracts/constants';
import { DeleteContractDialog } from '@/features/contracts/components/delete-contract-dialog';
import { ContractPdfUpload } from '@/features/contracts/components/contract-pdf-upload';
import { DepositCard } from '@/features/deposits/components/deposit-card';
import { RenewContractDialog } from '@/features/contracts/components/renew-contract-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/lib/format';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('contract') };
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const contract = await contractService
    .getById(ownerId, id)
    .catch((error) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    });

  const t = await getTranslations('contracts.detail');
  const formatDate = await getFormatDate();

  const rows = [
    {
      label: t('monthlyRent'),
      value: formatCurrency(contract.monthlyRent.toString(), contract.currency),
    },
    {
      label: t('securityDeposit'),
      value: formatCurrency(
        contract.securityDeposit.toString(),
        contract.currency,
      ),
    },
    { label: t('dueDay'), value: t('dueDayValue', { day: contract.dueDay }) },
    {
      label: t('maintenanceIncluded'),
      value: contract.maintenanceIncluded ? t('yes') : t('no'),
    },
    { label: t('startDate'), value: formatDate(contract.startDate) },
    {
      label: t('endDate'),
      value: contract.endDate
        ? formatDate(contract.endDate)
        : t('openEnded'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={contract.property.name}
        description={t('with', {
          name: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
        })}
        actions={
          <>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/app/payments/new?contractId=${contract.id}`}>
                <Wallet className="size-4" /> {t('registerPayment')}
              </Link>
            </Button>
            <div className="flex w-full gap-2 sm:contents">
              {!contract.renewedTo && contract.status !== 'CANCELLED' && (
                <RenewContractDialog
                  contractId={contract.id}
                  currentRent={Number(contract.monthlyRent)}
                  currency={contract.currency}
                  previousEndDate={contract.endDate}
                  className="min-w-0 flex-1 sm:flex-none"
                />
              )}
              <Button
                variant="outline"
                asChild
                className="min-w-0 flex-1 sm:flex-none"
              >
                <Link href={`/app/contracts/${contract.id}/edit`}>
                  <Pencil className="size-4" /> {t('edit')}
                </Link>
              </Button>
              <DeleteContractDialog
                contractId={contract.id}
                className="min-w-0 flex-1 sm:flex-none"
              />
            </div>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {(await getTranslations('contracts.statuses'))(contract.status)}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {t('paymentsRecorded', { count: contract._count.payments })}
        </span>
        {contract.renewedFrom && (
          <Link
            href={`/app/contracts/${contract.renewedFrom.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            {t('renewedFrom', {
              rent: formatCurrency(
                contract.renewedFrom.monthlyRent.toString(),
                contract.currency,
              ),
            })}
          </Link>
        )}
        {contract.renewedTo && (
          <Link
            href={`/app/contracts/${contract.renewedTo.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('renewedTo', {
              rent: formatCurrency(
                contract.renewedTo.monthlyRent.toString(),
                contract.currency,
              ),
            })}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('terms')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DepositCard
            ownerId={ownerId}
            contractId={contract.id}
            currency={contract.currency}
          />
          <ContractPdfUpload
            contractId={contract.id}
            pdfUrl={contract.contractPdfUrl}
          />
          {contract.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/90">
                {contract.notes}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
