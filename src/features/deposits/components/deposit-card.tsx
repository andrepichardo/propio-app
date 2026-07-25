import { getTranslations } from 'next-intl/server';
import { depositService } from '../services/deposit.service';
import { SettleDepositDialog } from './settle-deposit-dialog';
import { VoidSettlementDialog } from './void-settlement-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency, formatDate } from '@/shared/lib/format';

/**
 * Deposit state for a contract: what was collected, and — once the tenant
 * moves out — how it was split between returned and retained.
 */
export async function DepositCard({
  ownerId,
  contractId,
  currency,
}: {
  ownerId: string;
  contractId: string;
  currency: string;
}) {
  const t = await getTranslations('deposits');
  const summary = await depositService.getSummary(
    ownerId,
    contractId,
    currency,
  );

  const { held, settlement } = summary;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>
            {settlement ? t('settledOn', {
              date: formatDate(settlement.settledAt),
            }) : t('heldDescription')}
          </CardDescription>
        </div>
        {settlement ? (
          <VoidSettlementDialog
            settlementId={settlement.id}
            contractId={contractId}
          />
        ) : (
          held > 0 && (
            <SettleDepositDialog
              contractId={contractId}
              held={held}
              currency={currency}
            />
          )
        )}
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {held <= 0 && !settlement ? (
          <p className="py-2 text-muted-foreground">{t('noneCollected')}</p>
        ) : settlement ? (
          <>
            <Row
              label={t('collected')}
              value={formatCurrency(settlement.depositHeld, currency)}
            />
            <Row
              label={t('returnedToTenant')}
              value={formatCurrency(settlement.amountReturned, currency)}
            />
            <Row
              label={t('retainedByOwner')}
              value={formatCurrency(settlement.amountRetained, currency)}
              hint={
                settlement.amountRetained > 0 ? (
                  <Badge variant="secondary">{t('countsAsIncome')}</Badge>
                ) : null
              }
            />
            {settlement.reason ? (
              <div className="rounded-lg border p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('reason')}
                </p>
                <p className="leading-relaxed text-foreground/90">
                  {settlement.reason}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Row
              label={t('collected')}
              value={formatCurrency(held, currency)}
            />
            <p className="text-xs text-muted-foreground">
              {t('liabilityNote')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 font-medium">
        {hint}
        {value}
      </div>
    </div>
  );
}
