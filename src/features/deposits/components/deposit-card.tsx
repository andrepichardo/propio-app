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
import { formatCurrency } from '@/shared/lib/format';
import { getFormatDate } from '@/shared/lib/date-format.server';

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
  const formatDate = await getFormatDate();
  const summary = await depositService.getSummary(
    ownerId,
    contractId,
    currency,
  );

  const { held, settlement } = summary;

  // Rendered in two slots — top-right on desktop, bottom CTA on mobile — with
  // only one visible per breakpoint. Each instance owns its own dialog state.
  const action = settlement ? (
    <VoidSettlementDialog
      settlementId={settlement.id}
      contractId={contractId}
      className="w-full sm:w-auto"
    />
  ) : held > 0 ? (
    <SettleDepositDialog
      contractId={contractId}
      held={held}
      currency={currency}
      className="w-full sm:w-auto"
    />
  ) : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription className="text-pretty">
            {settlement ? t('settledOn', {
              date: formatDate(settlement.settledAt),
            }) : t('heldDescription')}
          </CardDescription>
        </div>
        {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-3 text-sm">
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
        {action ? (
          <div className="mt-auto pt-4 sm:hidden">{action}</div>
        ) : null}
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
