import { z } from 'zod';

/** Payload for (re)sending an existing receipt to its tenant. */
export const sendReceiptSchema = z.object({
  id: z.string().cuid(),
});

export type SendReceiptInput = z.infer<typeof sendReceiptSchema>;
