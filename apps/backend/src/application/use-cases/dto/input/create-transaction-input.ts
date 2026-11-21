import { z } from 'zod';
import { categoryId } from './category-fields';
import {
  transactionDate,
  transactionType,
  transactionValueInCents,
} from './transaction-fields';
import { userId } from './user-fields';

export const createTransactionInputSchema = z.object({
  userId,
  categoryId,
  type: transactionType,
  date: transactionDate,
  valueInCents: transactionValueInCents,
});

export type CreateTransactionInput = z.input<typeof createTransactionInputSchema>;
