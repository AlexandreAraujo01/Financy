import { z } from 'zod';
import { categoryId } from './category-fields';
import {
  transactionDate,
  transactionId,
  transactionType,
  transactionValueInCents,
} from './transaction-fields';
import { userId } from './user-fields';

export const updateTransactionInputSchema = z.object({
  userId,
  transactionId,
  // null vem do GraphQL quando o campo é enviado vazio; null não altera nada.
  categoryId: categoryId.nullish(),
  type: transactionType.nullish(),
  date: transactionDate.nullish(),
  valueInCents: transactionValueInCents.nullish(),
});

export type UpdateTransactionInput = z.input<typeof updateTransactionInputSchema>;
