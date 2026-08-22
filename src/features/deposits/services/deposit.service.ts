import 'server-only';
import { ActivityAction } from '@/generated/prisma/enums';
import { splitDeposit } from '@/shared/lib/deposit-split';
import { prisma } from '@/shared/lib/prisma';
import { depositRepository } from '../repositories/deposit.repository';
import type { SettleDepositInput } from '../validators/deposit.validators';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/shared/lib/errors';
import { logActivity } from '@/shared/lib/activity/activity-logger';
import { formatCurrency } from '@/shared/lib/format';

export type DepositSummary = {
  /** Deposit collected for this contract (sum of DEPOSIT payments). */
  held: number;
  currency: string;
  settlement: {
    id: string;
    depositHeld: number;
    amountReturned: number;
    amountRetained: number;
    reason: string | null;
    settledAt: Date;
  } | null;
};

export const depositService = {
  /** Deposit state for a contract: what was collected and how it was closed. */
  async getSummary(
    ownerId: string,
    contractId: string,
    currency: string,
  ): Promise<DepositSummary> {
    const [held, settlement] = await Promise.all([
      depositRepository.heldForContract(ownerId, contractId),
      depositRepository.findByContract(ownerId, contractId),
    ]);

    return {
      held,
      currency,
      settlement: settlement
        ? {
            id: settlement.id,
            depositHeld: Number(settlement.depositHeld),
            amountReturned: Number(settlement.amountReturned),
            amountRetained: Number(settlement.amountRetained),
            reason: settlement.reason,
            settledAt: settlement.settledAt,
          }
        : null,
    };
  },

  /**
   * Close the deposit cycle: the owner keeps `amountRetained` (damages,
   * cleaning, unpaid rent…) and hands the rest back. The returned amount is
   * derived, never entered, so the two always add up to what was collected.
   *
   * The retained part becomes income on `settledAt`; the returned part is the
   * tenant's own money and touches neither income nor expenses.
   */
  async settle(ownerId: string, input: SettleDepositInput) {
    const contract = await prisma.contract.findFirst({
      where: { id: input.contractId, ownerId, deletedAt: null },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!contract) {
      throw new ForbiddenError('Contract not found in your account.');
    }

    const existing = await depositRepository.findByContract(
      ownerId,
      contract.id,
    );
    if (existing) {
      throw new ConflictError('This deposit has already been settled.');
    }

    const held = await depositRepository.heldForContract(ownerId, contract.id);
    const split = splitDeposit(held, input.amountRetained);
    if (!split.ok) {
      if (split.reason === 'noDeposit') {
        throw new ValidationError(
          'No deposit was collected for this contract.',
        );
      }
      throw new ValidationError(
        'The retained amount cannot exceed the deposit collected.',
        { amountRetained: ['retainedExceedsDeposit'] },
      );
    }
    const { amountRetained, amountReturned } = split;

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await depositRepository.create(tx, {
        ownerId,
        contractId: contract.id,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        depositHeld: held,
        amountReturned,
        amountRetained,
        currency: contract.currency,
        reason: input.reason,
        settledAt: input.settledAt,
      });

      await logActivity({
        tx,
        ownerId,
        action: ActivityAction.CREATED,
        entityType: 'DepositSettlement',
        entityId: created.id,
        summary: `Settled the deposit for ${contract.property.name}: returned ${formatCurrency(amountReturned, contract.currency)}, kept ${formatCurrency(amountRetained, contract.currency)}`,
        messageKey: 'depositSettled',
        params: {
          property: contract.property.name,
          returned: formatCurrency(amountReturned, contract.currency),
          retained: formatCurrency(amountRetained, contract.currency),
        },
      });

      return created;
    });

    return { id: settlement.id, amountReturned, amountRetained };
  },

  /**
   * Void a settlement recorded by mistake.
   *
   * Soft-deleted rather than edited: the retained amount already counted as
   * income, so leaving the reversal on the record is more honest than
   * silently rewriting the numbers. Voiding puts the deposit back in "held"
   * and drops that income, freeing the owner to settle again correctly.
   */
  async voidSettlement(ownerId: string, id: string) {
    const voided = await depositRepository.softDelete(ownerId, id);
    if (!voided) throw new NotFoundError('Deposit settlement');

    await logActivity({
      ownerId,
      action: ActivityAction.DELETED,
      entityType: 'DepositSettlement',
      entityId: id,
      summary: 'Voided a deposit settlement',
      messageKey: 'depositSettlementVoided',
    });

    return { id };
  },
};
