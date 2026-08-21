import 'server-only';
import { PaymentStatus, PaymentType } from '@/generated/prisma/enums';
import { type Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import type { Converter } from '@/shared/lib/exchange-rates';

/** Guard against a malformed chain ever looping forever. */
const MAX_CHAIN_LENGTH = 50;

/**
 * Every contract in the same renewal chain, walking both directions.
 *
 * A deposit is collected once and carried across renewals, so "how much do we
 * hold for this tenant" can only be answered over the whole chain — asking a
 * single contract would report zero on every renewal after the first.
 */
async function chainIds(
  ownerId: string,
  contractId: string,
): Promise<string[]> {
  const ids = new Set<string>([contractId]);

  let cursor: string | null = contractId;
  for (let i = 0; i < MAX_CHAIN_LENGTH && cursor; i++) {
    const current: { renewedFromId: string | null } | null =
      await prisma.contract.findFirst({
        where: { id: cursor, ownerId },
        select: { renewedFromId: true },
      });
    cursor = current?.renewedFromId ?? null;
    if (cursor) ids.add(cursor);
  }

  cursor = contractId;
  for (let i = 0; i < MAX_CHAIN_LENGTH && cursor; i++) {
    const next: { id: string } | null = await prisma.contract.findFirst({
      where: { renewedFromId: cursor, ownerId },
      select: { id: true },
    });
    cursor = next?.id ?? null;
    if (cursor) ids.add(cursor);
  }

  return [...ids];
}

export const depositRepository = {
  chainIds,

  /** Deposit collected across the contract's whole renewal chain. */
  async heldForContract(ownerId: string, contractId: string): Promise<number> {
    const contractIds = await chainIds(ownerId, contractId);
    const result = await prisma.payment.aggregate({
      where: {
        ownerId,
        contractId: { in: contractIds },
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        type: PaymentType.DEPOSIT,
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  },

  /**
   * The live settlement for the chain, if any. A voided one is ignored, which
   * is what lets the owner correct a mistake and settle again.
   */
  async findByContract(ownerId: string, contractId: string) {
    const contractIds = await chainIds(ownerId, contractId);
    return prisma.depositSettlement.findFirst({
      where: { ownerId, contractId: { in: contractIds }, deletedAt: null },
    });
  },

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.DepositSettlementUncheckedCreateInput,
  ) {
    return tx.depositSettlement.create({ data });
  },

  /** Void a settlement, releasing the deposit back into "held". */
  async softDelete(ownerId: string, id: string): Promise<boolean> {
    const { count } = await prisma.depositSettlement.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  /** Retained deposit becomes income on `settledAt`. */
  async sumRetained(
    ownerId: string,
    from: Date,
    to: Date,
    convert: Converter,
    primary: string,
  ): Promise<{ total: number; approx: boolean }> {
    const groups = await prisma.depositSettlement.groupBy({
      by: ['currency'],
      where: { ownerId, deletedAt: null, settledAt: { gte: from, lte: to } },
      _sum: { amountRetained: true },
    });
    let total = 0;
    let approx = false;
    for (const g of groups) {
      const amount = Number(g._sum.amountRetained ?? 0);
      if (!amount) continue;
      total += convert(amount, g.currency);
      // Only a REAL conversion earns the ≈; a rate-less currency is reported
      // by the caller as `ratesUnavailable`.
      if (g.currency !== primary && convert.canConvert(g.currency)) {
        approx = true;
      }
    }
    return { total, approx };
  },

  /**
   * Held deposits broken down by tenant + property, so the dashboard can show
   * whose money each amount is. Grouped by property+tenant (not contract) so a
   * deposit carried across renewals nets against its settlement regardless of
   * which contract in the chain it sits on.
   */
  async heldBreakdown(ownerId: string): Promise<
    {
      propertyId: string;
      tenantId: string;
      property: string;
      tenant: string;
      amount: number;
      currency: string;
    }[]
  > {
    // Group by currency too so each held amount keeps its own currency; the
    // caller converts only the grand total to the primary currency.
    const [collected, settled] = await Promise.all([
      prisma.payment.groupBy({
        by: ['propertyId', 'tenantId', 'currency'],
        where: {
          ownerId,
          deletedAt: null,
          status: PaymentStatus.COMPLETED,
          type: PaymentType.DEPOSIT,
        },
        _sum: { amount: true },
      }),
      prisma.depositSettlement.groupBy({
        by: ['propertyId', 'tenantId', 'currency'],
        where: { ownerId, deletedAt: null },
        _sum: { depositHeld: true },
      }),
    ]);

    const settledMap = new Map(
      settled.map((s) => [
        `${s.propertyId}:${s.tenantId}:${s.currency}`,
        Number(s._sum.depositHeld ?? 0),
      ]),
    );

    const held = collected
      .map((c) => ({
        propertyId: c.propertyId,
        tenantId: c.tenantId,
        currency: c.currency,
        amount:
          Number(c._sum.amount ?? 0) -
          (settledMap.get(`${c.propertyId}:${c.tenantId}:${c.currency}`) ?? 0),
      }))
      // Ignore fully-settled (or rounding-noise) groups.
      .filter((h) => h.amount > 0.005)
      .sort((a, b) => b.amount - a.amount);

    if (held.length === 0) return [];

    const [properties, tenants] = await Promise.all([
      prisma.property.findMany({
        where: { id: { in: held.map((h) => h.propertyId) }, ownerId },
        select: { id: true, name: true },
      }),
      prisma.tenant.findMany({
        where: { id: { in: held.map((h) => h.tenantId) }, ownerId },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);
    const propertyName = new Map(properties.map((p) => [p.id, p.name]));
    const tenantName = new Map(
      tenants.map((t) => [t.id, `${t.firstName} ${t.lastName}`]),
    );

    return held.map((h) => ({
      ...h,
      property: propertyName.get(h.propertyId) ?? '',
      tenant: tenantName.get(h.tenantId) ?? '',
    }));
  },
};
