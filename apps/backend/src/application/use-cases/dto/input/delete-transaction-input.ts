import { z } from 'zod';
import { transactionId } from './transaction-fields';
import { userId } from './user-fields';

export const deleteTransactionInputSchema = z.object({
  userId,
  transactionId,
});

export type DeleteTransactionInput = z.input<typeof deleteTransactionInputSchema>;
