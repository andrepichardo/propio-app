import { PaymentMethod } from '@prisma/client';
import { Banknote, CreditCard, Landmark, ReceiptText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.TRANSFER]: 'Bank transfer',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.CHECK]: 'Check',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  [PaymentMethod.CASH]: Banknote,
  [PaymentMethod.TRANSFER]: Landmark,
  [PaymentMethod.CARD]: CreditCard,
  [PaymentMethod.CHECK]: ReceiptText,
};

export const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod).map(
  (value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }),
);
