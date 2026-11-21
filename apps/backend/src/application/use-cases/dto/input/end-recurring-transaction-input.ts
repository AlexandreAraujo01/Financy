import { z } from 'zod';
import { recurringTransactionId } from './recurring-transaction-fields';
import { userId } from './user-fields';

export const endRecurringTransactionInputSchema = z.object({ userId, recurringTransactionId });

export type EndRecurringTransactionInput = z.input<typeof endRecurringTransactionInputSchema>;
