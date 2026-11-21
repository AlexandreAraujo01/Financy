import { z } from 'zod';
import { categoryId } from './category-fields';
import {
  transactionDate,
  transactionDescription,
  transactionType,
  transactionValueInCents,
} from './transaction-fields';
import { userId } from './user-fields';

export const createTransactionInputSchema = z.object({
  userId,
  categoryId,
  description: transactionDescription,
  type: transactionType,
  date: transactionDate,
  valueInCents: transactionValueInCents,
});

export type CreateTransactionInput = z.input<typeof createTransactionInputSchema>;
