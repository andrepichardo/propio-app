import { PaymentMethod } from '@/generated/prisma/enums';
import { Banknote, CreditCard, Landmark, ReceiptText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Keys under `payments.methods` are the enum values; translate with
 * `t(\`methods.${value}\`)`. */
export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);

/** Proof of payment: a transfer screenshot or the bank's PDF receipt. Kept
 * here (not in the server-only uploads lib) so the client form can render the
 * matching `accept` filter and size hint. */
export const PAYMENT_PROOF_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
export const MAX_PAYMENT_PROOF_MB = 10;

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  [PaymentMethod.CASH]: Banknote,
  [PaymentMethod.TRANSFER]: Landmark,
  [PaymentMethod.CARD]: CreditCard,
  [PaymentMethod.CHECK]: ReceiptText,
};
