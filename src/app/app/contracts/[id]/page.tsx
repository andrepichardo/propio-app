import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Wallet } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { contractService } from '@/features/contracts/services/contract.service';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VARIANT,
} from '@/features/contracts/constants';
import { DeleteContractDialog } from '@/features/contracts/components/delete-contract-dialog';
import { ContractPdfUpload } from '@/features/contracts/components/contract-pdf-upload';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { formatCurrency, formatDate } from '@/shared/lib/format';

export const metadata: Metadata = { title: 'Contract' };

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

  const rows = [
    {
      label: 'Monthly rent',
      value: formatCurrency(contract.monthlyRent.toString(), contract.currency),
    },
    {
      label: 'Security deposit',
      value: formatCurrency(
        contract.securityDeposit.toString(),
        contract.currency,
      ),
    },
    { label: 'Rent due day', value: `Day ${contract.dueDay}` },
    {
      label: 'Maintenance included',
      value: contract.maintenanceIncluded ? 'Yes' : 'No',
    },
    { label: 'Start date', value: formatDate(contract.startDate) },
    {
      label: 'End date',
      value: contract.endDate ? formatDate(contract.endDate) : 'Open-ended',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={contract.property.name}
        description={`Contract with ${contract.tenant.firstName} ${contract.tenant.lastName}`}
        actions={
          <>
            <Button asChild>
              <Link href={`/app/payments/new?contractId=${contract.id}`}>
                <Wallet className="size-4" /> Register payment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/app/contracts/${contract.id}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
            <DeleteContractDialog contractId={contract.id} />
          </>
        }
      />

      <div className="flex items-center gap-2">
        <Badge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {CONTRACT_STATUS_LABELS[contract.status]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {contract._count.payments} payments recorded
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms</CardTitle>
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
          <ContractPdfUpload
            contractId={contract.id}
            pdfUrl={contract.contractPdfUrl}
          />
          {contract.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
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
