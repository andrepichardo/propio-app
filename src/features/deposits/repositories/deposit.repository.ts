import 'server-only';
import { PaymentStatus, PaymentType, type Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

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

  /**
   * Deposits already settled (returned + retained). Subtracted from collected
   * deposits to get what the owner still holds.
   */
  async totalSettled(ownerId: string): Promise<number> {
    const result = await prisma.depositSettlement.aggregate({
      where: { ownerId, deletedAt: null },
      _sum: { depositHeld: true },
    });
    return Number(result._sum.depositHeld ?? 0);
  },

  /** Retained deposit becomes income on `settledAt`. */
  async sumRetained(ownerId: string, from: Date, to: Date): Promise<number> {
    const result = await prisma.depositSettlement.aggregate({
      where: { ownerId, deletedAt: null, settledAt: { gte: from, lte: to } },
      _sum: { amountRetained: true },
    });
    return Number(result._sum.amountRetained ?? 0);
  },
};
