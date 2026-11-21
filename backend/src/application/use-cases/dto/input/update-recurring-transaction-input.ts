import { z } from 'zod';
import { categoryId } from './category-fields';
import { dayOfMonth, dayType, recurringTransactionId } from './recurring-transaction-fields';
import {
  transactionDescription,
  transactionType,
  transactionValueInCents,
} from './transaction-fields';
import { userId } from './user-fields';

export const updateRecurringTransactionInputSchema = z.object({
  userId,
  recurringTransactionId,
  // null vem do GraphQL quando o campo é enviado vazio; null não altera nada.
  categoryId: categoryId.nullish(),
  description: transactionDescription.nullish(),
  type: transactionType.nullish(),
  valueInCents: transactionValueInCents.nullish(),
  dayOfMonth: dayOfMonth.nullish(),
  dayType: dayType.nullish(),
});

export type UpdateRecurringTransactionInput = z.input<typeof updateRecurringTransactionInputSchema>;
