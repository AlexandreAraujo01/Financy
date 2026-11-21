import { z } from 'zod';
import { categoryId } from './category-fields';
import { dayOfMonth, dayType } from './recurring-transaction-fields';
import {
  transactionDate,
  transactionDescription,
  transactionType,
  transactionValueInCents,
} from './transaction-fields';
import { userId } from './user-fields';

export const createRecurringTransactionInputSchema = z.object({
  userId,
  categoryId,
  description: transactionDescription,
  type: transactionType,
  valueInCents: transactionValueInCents,
  dayOfMonth,
  dayType: dayType.default('calendar_day'),
  // A partir de quando a recorrência vale; a primeira ocorrência é o dia escolhido a partir daqui.
  startDate: transactionDate,
}).refine(data => data.dayType !== 'business_day' || data.dayOfMonth <= 23, {
  path: ['dayOfMonth'], message: 'Escolha um dia útil entre 1 e 23',
});

export type CreateRecurringTransactionInput = z.input<typeof createRecurringTransactionInputSchema>;
